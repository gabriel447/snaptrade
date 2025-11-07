import { useMemo, useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

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

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      if (!preview) {
        throw new Error('Selecione uma imagem primeiro')
      }
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
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

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
          <input id="fileInput" className="file-input" type="file" accept="image/*" onChange={onFileChange} />
          <label htmlFor="fileInput" className="picker">
            <div className="picker-icon" aria-hidden="true">📈</div>
            <div className="picker-text">
              <h2>Selecionar Gráfico</h2>
              <span className="hint">Envie seu gráfico para análise</span>
              {file && <span className="filename">{file.name}</span>}
            </div>
          </label>
          {preview && (
            <div className="preview">
              <img src={preview} alt="Prévia do gráfico selecionado" />
            </div>
          )}
        </section>

        <button className="primary" disabled={!preview || loading} onClick={handleAnalyze}>
          {loading ? 'Analisando...' : 'Analisar Agora'}
        </button>

        {error && <div role="alert" className="error">Erro: {error}</div>}

        {result && (
          <section className="card result">
            <h2>Resultado</h2>
            <p><strong>Sinal:</strong> {result.sinal} ({mapSinalToAposta(result.sinal)})</p>
            <p><strong>Confiança:</strong> {result.confianca}</p>
            <p><strong>Explicação:</strong> {result.explicacao}</p>
          </section>
        )}
      </main>
    </div>
  )
}

export default App