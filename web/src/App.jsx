import { useMemo, useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressRAF = useRef(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorFriendly, setErrorFriendly] = useState('')

  const apiBase = useMemo(() => import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000', [])
  const apiToken = useMemo(() => import.meta.env.VITE_API_TOKEN || '', [])

  function onFileChange(e) {
    const f = e.target.files?.[0] || null
    setFile(f)
    setResult(null)
    setError(null)
    if (f) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }

  function cancelSelection() {
    if (loading || analyzing) return
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    setResult(null)
    setAnalyzing(true)
    setProgress(0)

    const simulateProgress = () => new Promise((resolve) => {
      const totalMs = 8000
      const start = performance.now()
      const tick = (now) => {
        const pct = Math.min(100, Math.round(((now - start) / totalMs) * 100))
        setProgress(pct)
        if (pct < 100) {
          progressRAF.current = requestAnimationFrame(tick)
        } else {
          setTimeout(resolve, 400)
        }
      }
      progressRAF.current = requestAnimationFrame(tick)
    })

    const fetchAnalyze = async () => {
      if (!preview) throw new Error('Selecione uma imagem primeiro')
      const res = await fetch(`${apiBase}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiToken ? { 'Authorization': `Bearer ${apiToken}` } : {})
        },
        body: JSON.stringify({ imageBase64: preview, context: { timeframe: '1m' } })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Falha ao consultar API')
      }
      return data
    }

    try {
      const [data] = await Promise.all([fetchAnalyze(), simulateProgress()])
      setResult(data)
    } catch (err) {
      setError(err.message)
      setErrorFriendly('Ocorreu um erro. Tente novamente.')
      console.error(err)
      setShowErrorModal(true)
    } finally {
      if (progressRAF.current) cancelAnimationFrame(progressRAF.current)
      setAnalyzing(false)
      setLoading(false)
      setFile(null)
      setPreview(null)
    }
  }

  // Oculta modal de erro após animação
  useEffect(() => {
    if (showErrorModal) {
      const t = setTimeout(() => setShowErrorModal(false), 4000)
      return () => clearTimeout(t)
    }
  }, [showErrorModal])

  function mapSinalToAposta(sinal) {
    if (sinal === 'COMPRAR') return 'Apostar para cima'
    if (sinal === 'VENDER') return 'Apostar para baixo'
    return 'Aguardar'
  }

  return (
    <div className="page">
      <header className="hero">
        <h1 className="title">SnapTrade</h1>
        <p className="subtitle">Envie seu gráfico para análise</p>
      </header>

      <main className="content">
        <section className="card upload-card">
          {!preview && (
            <>
              <input id="fileInput" className="file-input" type="file" accept="image/*" onChange={onFileChange} />
              <label htmlFor="fileInput" className="picker">
                <div className="picker-icon" aria-hidden="true">📈</div>
                <div className="picker-text">
                  <h2>Selecionar Gráfico</h2>
                  <span className="hint">Envie seu gráfico para análise</span>
                  {file && <span className="filename">{file.name}</span>}
                </div>
              </label>
            </>
          )}
          {preview && (
            <div className="preview with-close">
              <button
                type="button"
                className="preview-close"
                aria-label="Cancelar seleção"
                title="Cancelar"
                onClick={cancelSelection}
                disabled={loading || analyzing}
              >
                ×
              </button>
              <img src={preview} alt="Prévia do gráfico selecionado" />
            </div>
          )}
        </section>

        <button className="primary" disabled={!preview || loading} onClick={handleAnalyze}>
          {loading ? 'Analisando...' : 'Analisar Agora'}
        </button>

        {/* Removido erro inferior para usar apenas modal no topo */}

        {result && (
          <section className="card result">
            <h2 className="result-title">Resultado da Análise</h2>
            <div
              className={
                'result-cta ' +
                (result.sinal === 'VENDER'
                  ? 'sell'
                  : result.sinal === 'COMPRAR'
                  ? 'buy'
                  : 'wait')
              }
            >
              {result.sinal}
            </div>
            <div className="result-details">
              <div className="detail"><span>Confiança</span><strong>{result.confianca}</strong></div>
              <div className="detail"><span>Aposta</span><strong>{mapSinalToAposta(result.sinal)}</strong></div>
            </div>
            <p className="result-explain">{result.explicacao}</p>
          </section>
        )}
      </main>
      {showErrorModal && (
        <div className="error-modal">
          <div className="error-card">
            <strong>Erro</strong>
            <span className="error-msg">{errorFriendly}</span>
          </div>
        </div>
      )}
      {analyzing && (
        <div className="overlay">
          <div className="modal">
            <h2 className="modal-title">Analisando Mercado</h2>
            <p className="modal-sub">Nosso algoritmo está processando os dados para sua operação</p>
            {[
              'IA analisando padrões complexos...',
              'Algoritmos processando dados...',
              'Rede neural deep learning...',
              'IA gerando predições avançadas...'
            ].map((label, i) => {
              const start = i * 25
              const end = start + 25
              const w = Math.max(0, Math.min(progress - start, 25)) / 25 * 100
              const done = progress >= end
              const colorClass = ['teal', 'purple', 'orange', 'pink'][i]
              return (
                <div className="step" key={i}>
                  <div className="step-head">
                    <span>{label}</span>
                    {done && <span className="check">✓</span>}
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${colorClass}`} style={{ width: `${w}%` }} />
                  </div>
                </div>
              )
            })}
            <div className="overall">Processando {progress}%</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App