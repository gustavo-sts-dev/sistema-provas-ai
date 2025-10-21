import React, { useState, useEffect, useMemo, Suspense } from 'react';
import axios from 'axios';
import { api } from '../config/api';
import ItemActions from '../components/ItemActions';
import { itemMeta, getAvailableFolders } from '../utils/storage';
import FolderBar from '../components/FolderBar';

const ViewResults = () => {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCorrection, setSelectedCorrection] = useState(null);
  const [charts, setCharts] = useState(null);
  const [activeFolder, setActiveFolder] = useState('Sem pasta');

  const getQuestionText = (answer) => {
    const questions = selectedCorrection?.examId?.questions || [];
    const questionId = answer?.questionId || answer?.question?.id;
    const found = questions.find(q => String(q._id) === String(questionId));
    return found?.question || answer?.question || 'Enunciado não disponível';
  };

  useEffect(() => {
    fetchCorrections();
  }, []);

  useEffect(() => {
    Promise.all([
      import('chart.js/auto'),
      import('react-chartjs-2')
    ]).then(([_, rc2]) => {
      setCharts({ 
        Doughnut: rc2.Doughnut, 
        Bar: rc2.Bar,
        Line: rc2.Line 
      });
    }).catch(() => {
      setCharts(null);
    });
  }, []);

  const fetchCorrections = async () => {
    try {
      const response = await axios.get(api.getCorrectedExams());
      setCorrections(response.data.corrections);
    } catch (error) {
      console.error('Erro ao carregar correções:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardData = useMemo(() => {
    if (!selectedCorrection) return null;
    const total = selectedCorrection.maxScore || 0;
    const earned = selectedCorrection.totalScore || 0;
    const perQuestion = selectedCorrection.answers.map((a, i) => ({
      label: `Q${i + 1}`,
      score: a.points || 0
    }));
    const correctCount = selectedCorrection.answers.filter(a => a.feedback && a.feedback.toLowerCase().includes('corret')).length;
    const wrongCount = selectedCorrection.answers.length - correctCount;
    return { total, earned, perQuestion, correctCount, wrongCount };
  }, [selectedCorrection]);

  const visibleCorrections = useMemo(() => {
    return corrections
      .filter(c => (activeFolder === 'Sem pasta' ? (itemMeta.get('correction', c._id).folder || '') === '' : itemMeta.get('correction', c._id).folder === activeFolder));
  }, [corrections, activeFolder]);

  const folders = useMemo(() => ['Sem pasta', ...getAvailableFolders('correction', corrections)], [corrections]);

  const dashboardAll = useMemo(() => {
    if (!corrections || corrections.length === 0) return null;
    
    const grade = (c) => {
      if (!c.totalScore || !c.maxScore || c.maxScore === 0) return 'F';
      const pct = (c.totalScore / c.maxScore) * 100;
      if (pct >= 90) return 'A';
      if (pct >= 80) return 'B';
      if (pct >= 70) return 'C';
      if (pct >= 60) return 'D';
      return 'F';
    };

    const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    const methodCounts = { automatic: 0, manual: 0 };
    const byDate = {};
    const byExam = {};
    const byStudent = {};

    corrections.forEach(c => {
      if (!c) return;
      
      gradeCounts[grade(c)]++;
      methodCounts[c.correctionMethod] = (methodCounts[c.correctionMethod] || 0) + 1;
      
      const correctedDate = c.correctedAt ? new Date(c.correctedAt) : new Date();
      const day = correctedDate.toISOString().slice(0,10);
      if (!byDate[day]) byDate[day] = { sum: 0, max: 0, count: 0 };
      byDate[day].sum += c.totalScore || 0;
      byDate[day].max += c.maxScore || 0;
      byDate[day].count += 1;
      
      // Título da prova (denormalizado ou populado)
      const examTitle = (c.examTitle || c.examId?.title || '').trim();
      if (examTitle && examTitle.length > 0) {
        if (!byExam[examTitle]) byExam[examTitle] = { sum: 0, max: 0, count: 0 };
        byExam[examTitle].sum += c.totalScore || 0;
        byExam[examTitle].max += c.maxScore || 0;
        byExam[examTitle].count += 1;
      }
      
      const student = (c.studentName || 'Aluno').trim();
      if (student.length > 0) {
        if (!byStudent[student]) byStudent[student] = { sum: 0, max: 0, count: 0 };
        byStudent[student].sum += c.totalScore || 0;
        byStudent[student].max += c.maxScore || 0;
        byStudent[student].count += 1;
      }
    });

    const trendLabels = Object.keys(byDate).sort();
    const trendPct = trendLabels.map(d => {
      const v = byDate[d];
      return v.max > 0 ? Math.round((v.sum / v.max) * 100) : 0;
    });

    const examsLabels = Object.keys(byExam);
    const examsAvg = examsLabels.map(k => {
      const v = byExam[k];
      return v.max > 0 ? Math.round((v.sum / v.max) * 100) : 0;
    });

    const students = Object.keys(byStudent).map(name => {
      const v = byStudent[name];
      return { 
        name: name || 'Aluno', 
        pct: v.max > 0 ? (v.sum / v.max) * 100 : 0 
      };
    }).sort((a,b) => b.pct - a.pct).slice(0,10);

    const validCorrections = corrections.filter(c => c && c.totalScore !== undefined && c.maxScore > 0);
    const avgPct = validCorrections.length > 0 
      ? Math.round((validCorrections.reduce((s,c)=>s + (c.totalScore/c.maxScore),0) / validCorrections.length) * 100)
      : 0;

    return {
      gradeCounts,
      methodCounts,
      trendLabels,
      trendPct,
      examsLabels,
      examsAvg,
      students,
      avgPct,
      total: corrections.length
    };
  }, [corrections]);

  const ConfigurableCharts = () => {
    const [chartConfigs, setChartConfigs] = useState({
      grades: { show: true, type: 'doughnut' },
      methods: { show: true, type: 'doughnut' },
      trend: { show: true, type: 'bar' },
      exams: { show: true, type: 'bar', orientation: 'horizontal', limit: 10 },
      students: { show: true, type: 'bar', orientation: 'horizontal', limit: 5 },
      performance: { show: true, type: 'line' }
    });

    const [showConfig, setShowConfig] = useState(false);

    if (!charts || !charts.Doughnut || !charts.Bar || !dashboardAll) return null;
    
    const { Doughnut, Bar, Line } = charts;

    const valueToColor = (pct) => {
      if (pct < 40) return '#ef4444';
      if (pct < 50) return '#f472b6';
      if (pct < 80) return '#f59e0b';
      return '#22c55e';
    };

    const GradesChart = () => {
      if (!chartConfigs.grades.show) return null;
      const data = {
        labels: ['A', 'B', 'C', 'D', 'F'],
        datasets: [{
          data: ['A', 'B', 'C', 'D', 'F'].map(k => dashboardAll.gradeCounts[k]),
          backgroundColor: ['#16a34a', '#2563eb', '#eab308', '#fb923c', '#ef4444']
        }]
      };
      const ChartComponent = chartConfigs.grades.type === 'doughnut' ? Doughnut : Bar;
      return (
        <div className="bg-white border rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold">Distribuição de Notas</h4>
            <button onClick={() => setChartConfigs(prev => ({
              ...prev,
              grades: { ...prev.grades, type: prev.grades.type === 'doughnut' ? 'bar' : 'doughnut' }
            }))} className="text-xs text-blue-500 hover:underline">
              {chartConfigs.grades.type === 'doughnut' ? '📊 Barra' : '🍩 Pizza'}
            </button>
          </div>
          <ChartComponent data={data} options={chartConfigs.grades.type === 'bar' ? { scales: { y: { beginAtZero: true } } } : {}} />
        </div>
      );
    };

    const MethodsChart = () => {
      if (!chartConfigs.methods.show) return null;
      const data = {
        labels: ['Automático', 'Manual'],
        datasets: [{
          data: [dashboardAll.methodCounts.automatic, dashboardAll.methodCounts.manual],
          backgroundColor: ['#22c55e', '#a78bfa']
        }]
      };
      const ChartComponent = chartConfigs.methods.type === 'doughnut' ? Doughnut : Bar;
      return (
        <div className="bg-white border rounded p-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold">Método de Correção</h4>
            <button onClick={() => setChartConfigs(prev => ({
              ...prev,
              methods: { ...prev.methods, type: prev.methods.type === 'doughnut' ? 'bar' : 'doughnut' }
            }))} className="text-xs text-blue-500 hover:underline">
              {chartConfigs.methods.type === 'doughnut' ? '📊 Barra' : '🍩 Pizza'}
            </button>
          </div>
          <ChartComponent data={data} options={chartConfigs.methods.type === 'bar' ? { scales: { y: { beginAtZero: true } } } : {}} />
        </div>
      );
    };

    const TrendChart = () => {
      if (!chartConfigs.trend.show) return null;
      const data = {
        labels: dashboardAll.trendLabels.map(date => {
          const d = new Date(date);
          return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }),
        datasets: [{
          label: 'Média diária (%)',
          data: dashboardAll.trendPct,
          backgroundColor: chartConfigs.trend.type === 'bar' ? dashboardAll.trendPct.map(valueToColor) : 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3b82f6',
          borderWidth: 2,
          tension: 0.4,
          fill: chartConfigs.trend.type === 'line'
        }]
      };
      const ChartComponent = chartConfigs.trend.type === 'bar' ? Bar : (Line || Bar);
      return (
        <div className="bg-white border rounded p-3 lg:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold">Evolução Temporal</h4>
            <button onClick={() => setChartConfigs(prev => ({
              ...prev,
              trend: { ...prev.trend, type: prev.trend.type === 'bar' ? 'line' : 'bar' }
            }))} className="text-xs text-blue-500 hover:underline">
              {chartConfigs.trend.type === 'bar' ? '📈 Linha' : '📊 Barra'}
            </button>
          </div>
          <ChartComponent data={data} options={{ 
            responsive: true,
            scales: { 
              y: { 
                beginAtZero: true, 
                max: 100,
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              } 
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': ' + context.parsed.y + '%';
                  }
                }
              }
            }
          }} />
        </div>
      );
    };

    const ExamsChart = () => {
      if (!chartConfigs.exams.show) return null;
      const validExams = dashboardAll.examsLabels
        .map((label, idx) => ({ label, avg: dashboardAll.examsAvg[idx] }))
        .filter(e => e.label && e.label !== 'Sem título' && e.label.trim() !== '')
        .slice(0, chartConfigs.exams.limit);
      
      if (validExams.length === 0) {
        return (
          <div className="bg-white border rounded p-3 lg:col-span-2">
            <h4 className="text-sm font-semibold mb-2">Média por Prova</h4>
            <p className="text-sm text-gray-500 text-center py-4">Nenhuma prova com título válido</p>
          </div>
        );
      }

      const data = {
        labels: validExams.map(e => e.label.length > 30 ? e.label.substring(0, 30) + '...' : e.label),
        datasets: [{
          label: 'Média da prova (%)',
          data: validExams.map(e => e.avg),
          backgroundColor: validExams.map(e => valueToColor(e.avg))
        }]
      };
      return (
        <div className="bg-white border rounded p-3 lg:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold">Média por Prova</h4>
            <div className="flex gap-2 items-center">
              <select value={chartConfigs.exams.limit} onChange={(e) => setChartConfigs(prev => ({
                ...prev,
                exams: { ...prev.exams, limit: parseInt(e.target.value) }
              }))} className="text-xs border rounded px-1">
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="20">Todas</option>
              </select>
              <button onClick={() => setChartConfigs(prev => ({
                ...prev,
                exams: { ...prev.exams, orientation: prev.exams.orientation === 'horizontal' ? 'vertical' : 'horizontal' }
              }))} className="text-xs text-blue-500 hover:underline">
                🔄
              </button>
            </div>
          </div>
          <Bar data={data} options={{
            indexAxis: chartConfigs.exams.orientation === 'horizontal' ? 'y' : 'x',
            responsive: true,
            scales: chartConfigs.exams.orientation === 'horizontal' 
              ? { x: { beginAtZero: true, max: 100, ticks: { callback: (value) => value + '%' } } }
              : { y: { beginAtZero: true, max: 100, ticks: { callback: (value) => value + '%' } } },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': ' + context.parsed[chartConfigs.exams.orientation === 'horizontal' ? 'x' : 'y'] + '%';
                  }
                }
              }
            }
          }} />
        </div>
      );
    };

    const StudentsChart = () => {
      if (!chartConfigs.students.show) return null;
      const limited = dashboardAll.students.slice(0, chartConfigs.students.limit);
      const data = {
        labels: limited.map(s => s.name),
        datasets: [{
          label: 'Média do aluno (%)',
          data: limited.map(s => Math.round(s.pct)),
          backgroundColor: limited.map(s => valueToColor(Math.round(s.pct)))
        }]
      };
      return (
        <div className="bg-white border rounded p-3 lg:col-span-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold">Top Alunos</h4>
            <div className="flex gap-2 items-center">
              <select value={chartConfigs.students.limit} onChange={(e) => setChartConfigs(prev => ({
                ...prev,
                students: { ...prev.students, limit: parseInt(e.target.value) }
              }))} className="text-xs border rounded px-1">
                <option value="3">Top 3</option>
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
              </select>
              <button onClick={() => setChartConfigs(prev => ({
                ...prev,
                students: { ...prev.students, orientation: prev.students.orientation === 'horizontal' ? 'vertical' : 'horizontal' }
              }))} className="text-xs text-blue-500 hover:underline">
                🔄
              </button>
            </div>
          </div>
          <Bar data={data} options={{
            indexAxis: chartConfigs.students.orientation === 'horizontal' ? 'y' : 'x',
            responsive: true,
            scales: chartConfigs.students.orientation === 'horizontal'
              ? { x: { beginAtZero: true, max: 100, ticks: { callback: (value) => value + '%' } } }
              : { y: { beginAtZero: true, max: 100, ticks: { callback: (value) => value + '%' } } },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': ' + context.parsed[chartConfigs.students.orientation === 'horizontal' ? 'x' : 'y'] + '%';
                  }
                }
              }
            }
          }} />
        </div>
      );
    };

    const PerformanceChart = () => {
      if (!chartConfigs.performance.show || !Line) return null;
      
      const movingAvg = dashboardAll.trendLabels.map((_, idx) => {
        const window = 3;
        const start = Math.max(0, idx - window + 1);
        const values = dashboardAll.trendPct.slice(start, idx + 1);
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      });

      const data = {
        labels: dashboardAll.trendLabels.map(date => {
          const d = new Date(date);
          return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }),
        datasets: [
          {
            label: 'Média diária (%)',
            data: dashboardAll.trendPct,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Média móvel 3 dias (%)',
            data: movingAvg,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      };

      return (
        <div className="bg-white border rounded p-3 lg:col-span-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold">Performance Geral</h4>
          </div>
          <Line data={data} options={{ 
            responsive: true,
            scales: { 
              y: { 
                beginAtZero: true, 
                max: 100,
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              } 
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': ' + context.parsed.y + '%';
                  }
                }
              }
            }
          }} />
        </div>
      );
    };

    return (
      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Dashboard Configurável</h3>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              {showConfig ? 'Ocultar' : 'Configurar'} ⚙️
            </button>
          </div>

          {showConfig && (
            <div className="mb-4 p-3 bg-gray-50 rounded border">
              <h4 className="text-sm font-semibold mb-2">Mostrar/Ocultar Gráficos:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(chartConfigs).map(([key, config]) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={config.show}
                      onChange={(e) => setChartConfigs(prev => ({
                        ...prev,
                        [key]: { ...prev[key], show: e.target.checked }
                      }))}
                    />
                    {key === 'grades' && '📊 Notas'}
                    {key === 'methods' && '🔧 Métodos'}
                    {key === 'trend' && '📈 Tendência'}
                    {key === 'exams' && '📝 Por Prova'}
                    {key === 'students' && '🎓 Top Alunos'}
                    {key === 'performance' && '⚡ Performance'}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500">Provas corrigidas</div>
              <div className="text-2xl font-bold">{dashboardAll.total}</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500">Média geral</div>
              <div className="text-2xl font-bold">{dashboardAll.avgPct}%</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500">Automático</div>
              <div className="text-2xl font-bold">{dashboardAll.methodCounts.automatic}</div>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-500">Manual</div>
              <div className="text-2xl font-bold">{dashboardAll.methodCounts.manual}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-h-[66vh] overflow-auto">
            <GradesChart />
            <TrendChart />
            <MethodsChart />
            <ExamsChart />
            <StudentsChart />
            <PerformanceChart />
          </div>
        </div>
      </div>
    );
  };

  const ChartSection = () => {
    if (!charts || !charts.Doughnut || !charts.Bar) {
      return <div className="text-sm text-gray-500 mb-6">Carregando gráficos...</div>;
    }
    const { Doughnut, Bar } = charts;
    const valueToColor = (pct) => {
      if (pct < 40) return '#ef4444';
      if (pct < 50) return '#f472b6';
      if (pct < 80) return '#f59e0b';
      return '#22c55e';
    };

    const ringData = {
      labels: ['Obtida', 'Restante'],
      datasets: [{
        data: [dashboardData.earned, Math.max(dashboardData.total - dashboardData.earned, 0)],
        backgroundColor: ['#22c55e', '#e5e7eb']
      }]
    };

    const perQuestionPercents = dashboardData.perQuestion.map((p, idx) => {
      const q = selectedCorrection?.examId?.questions?.[idx];
      const maxPts = q?.points || 0;
      return maxPts > 0 ? Math.round((p.score / maxPts) * 100) : 0;
    });

    const barData = {
      labels: dashboardData.perQuestion.map(p => p.label),
      datasets: [{
        label: 'Desempenho (%) por questão',
        data: perQuestionPercents,
        backgroundColor: perQuestionPercents.map(valueToColor)
      }]
    };

    const pieData = {
      labels: ['Corretas', 'Erradas'],
      datasets: [{
        data: [dashboardData.correctCount, dashboardData.wrongCount],
        backgroundColor: ['#22c55e', '#ef4444']
      }]
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h4 className="text-sm font-semibold mb-2">Progresso da Nota</h4>
          <Doughnut data={ringData} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
          <h4 className="text-sm font-semibold mb-2">Pontos por Questão</h4>
          <Bar data={barData} options={{ scales: { y: { beginAtZero: true } } }} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow md:col-span-1">
          <h4 className="text-sm font-semibold mb-2">Acertos x Erros</h4>
          <Doughnut data={pieData} />
        </div>
      </div>
    );
  };

  const calculateGrade = (totalScore, maxScore) => {
    const percentage = (totalScore / maxScore) * 100;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando resultados...</div>
      </div>
    );
  }

  if (selectedCorrection) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => setSelectedCorrection(null)}
            className="text-blue-500 hover:text-blue-700 text-sm sm:text-base"
          >
            ← Voltar para lista
          </button>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Resultado da Prova
          </h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedCorrection.examTitle || selectedCorrection.examId?.title || 'Prova'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-2">
              Aluno: {selectedCorrection.studentName}
            </p>
            <p className="text-sm sm:text-base text-gray-600 mb-2">
              Corrigida por: {selectedCorrection.correctedBy}
            </p>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Corrigida em: {new Date(selectedCorrection.correctedAt).toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-lg font-semibold text-gray-900">
                  Nota Final: {selectedCorrection.totalScore}/{selectedCorrection.maxScore}
                </span>
                <span className={`ml-2 text-lg font-bold ${getGradeColor(calculateGrade(selectedCorrection.totalScore, selectedCorrection.maxScore))}`}>
                  ({calculateGrade(selectedCorrection.totalScore, selectedCorrection.maxScore)})
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Método: {selectedCorrection.correctionMethod === 'automatic' ? 'Automático' : 'Manual'}
              </div>
            </div>
          </div>

          {dashboardData && (
            <Suspense fallback={<div className="text-sm text-gray-500 mb-6">Carregando gráficos...</div>}>
              <ChartSection />
            </Suspense>
          )}

          <div className="space-y-6">
            {selectedCorrection.answers.map((answer, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Questão {index + 1}
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enunciado da Questão:
                  </label>
                  <div className="bg-white p-3 rounded-md border border-gray-100">
                    <p className="whitespace-pre-wrap text-gray-800">{getQuestionText(answer)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resposta do Aluno:
                  </label>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="whitespace-pre-wrap">{answer.studentAnswer}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resposta Correta:
                  </label>
                  <div className="bg-green-50 p-3 rounded-md">
                    <p className="whitespace-pre-wrap">{answer.correctAnswer}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pontuação
                    </label>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <span className="font-semibold text-blue-900">
                        {answer.points} pontos
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback
                    </label>
                    <div className={`${(typeof answer.points === 'number' && answer.points === 0) || (answer.feedback && answer.feedback.toLowerCase().includes('incorret')) ? 'bg-red-50' : 'bg-yellow-50'} p-3 rounded-md`}>
                      <p className="text-gray-700">{answer.feedback}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
        Resultados das Provas
      </h1>

      <FolderBar type="correction" items={corrections} activeFolder={activeFolder} onActiveFolderChange={setActiveFolder} onDropToFolder={() => setCorrections([...corrections])} />

      {dashboardAll && <ConfigurableCharts />}

      {visibleCorrections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Nenhuma prova corrigida ainda.
        </div>
      ) : (
        <div className="space-y-4">
          {visibleCorrections.map((correction) => (
            <div key={correction._id} className={`bg-white p-4 sm:p-6 rounded-lg shadow-md ${itemMeta.get('correction', correction._id).archived ? 'opacity-60' : ''}`}
              draggable onDragStart={(e)=>e.dataTransfer.setData('text/plain', correction._id)}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div className="flex-1 mb-4 sm:mb-0">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    {correction.examTitle || correction.examId?.title || 'Prova sem título'}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">
                    Aluno: {correction.studentName}
                  </p>
                  <p className="text-sm sm:text-base text-gray-600 mb-2">
                    Corrigida por: {correction.correctedBy}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-2">
                    Corrigida em: {new Date(correction.correctedAt).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <span className="text-sm sm:text-lg font-semibold text-gray-900">
                      Nota: {correction.totalScore}/{correction.maxScore}
                    </span>
                    <span className={`text-sm sm:text-lg font-bold ${getGradeColor(calculateGrade(correction.totalScore, correction.maxScore))}`}>
                      ({calculateGrade(correction.totalScore, correction.maxScore)})
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500">
                      {correction.correctionMethod === 'automatic' ? 'Automático' : 'Manual'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ItemActions type="correction" id={correction._id} onChange={() => fetchCorrections()} />
                  <div className="relative group">
                    <button className="px-2 py-1 text-gray-600 hover:text-gray-800">⋯</button>
                    <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded shadow-md p-2 hidden group-hover:block z-10 min-w-[180px] before:content-[''] before:absolute before:inset-x-0 before:top-0 before:-translate-y-full before:h-1">
                      {folders.map(folder => (
                        <button key={folder} onClick={() => { itemMeta.set('correction', correction._id, { folder: folder === 'Sem pasta' ? '' : folder }); setCorrections([...corrections]); }} className="block text-left w-full text-sm px-2 py-1 hover:bg-gray-50">Mover para: {folder}</button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await axios.get(api.getCorrectionById(correction._id));
                        setSelectedCorrection(res.data.correction);
                      } catch (e) {
                        setSelectedCorrection(correction);
                      }
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors text-sm sm:text-base"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewResults;