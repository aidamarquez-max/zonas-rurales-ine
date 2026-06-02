/**
 * ine.js — Carga de datos 100% offline desde municipios_ine.json
 *
 * Fuentes embebidas en el JSON:
 *   Población:    INE, Revisión Padrón Municipal, 1 enero 2025 (pobmun25.xlsx)
 *   Superficie:   Ministerio de Política Territorial, REL 2020 (esp_municipios_20200518.csv)
 *   Grupos edad:  INE, Nomenclátor Nacional 2025 — hoja Edad (nomdef2025.xlsx)
 *                 Grupos: 0-15 / 16-64 / 65+ · Ref. 1 enero 2025
 *
 * Criterio zona rural — Ley 45/2007, art. 3:
 *   Población < 30.000 hab. Y densidad < 100 hab/km²
 */

/** Carga y parsea el JSON estático */
export async function cargarMunicipios() {
  const r = await fetch('/municipios_ine.json')
  if (!r.ok) throw new Error(`No se pudo cargar municipios_ine.json: HTTP ${r.status}`)
  return r.json()
}

/**
 * Aplica el criterio de zona rural y calcula campos derivados.
 * Filtra por provincia si se indica codProv.
 */
export function buildDataset(municipios, codProv = null) {
  const data = codProv
    ? municipios.filter(m => m.cpro === codProv.padStart(2,'0'))
    : municipios

  return data.map(m => ({
    ...m,
    esRural: m.densidad != null && m.pob2025 < 30_000 && m.densidad < 100,
    sinSuperficie: m.sup_km2 == null,
  })).sort((a, b) => b.pob2025 - a.pob2025)
}

/** Agrupación por CCAA */
export function agruparCCAA(dataset) {
  const map = new Map()
  for (const m of dataset) {
    const k = m.ccaa || 'Sin CCAA'
    if (!map.has(k)) map.set(k, { ccaa: k, nTotal: 0, nRural: 0, pob: 0, pobRural: 0, lab: 0, may: 0 })
    const g = map.get(k)
    g.nTotal++; g.pob += m.pob2025
    if (m.esRural) {
      g.nRural++; g.pobRural += m.pob2025
      g.lab += m.pob_16_64 ?? 0
      g.may += m.pob_65_mas ?? 0
    }
  }
  return [...map.values()]
    .map(g => ({ ...g,
      pctRural: g.nTotal ? +((g.nRural/g.nTotal)*100).toFixed(1) : 0,
      pctLab:   g.pobRural ? +((g.lab/g.pobRural)*100).toFixed(1) : 0,
      pctMay:   g.pobRural ? +((g.may/g.pobRural)*100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.nRural - a.nRural)
}

/** Exportar CSV */
export function toCSV(dataset, titulo = '') {
  const BOM = '\uFEFF'
  const SEP = ';'
  const cols = ['cod','nombre','provincia','ccaa','pob2025','sup_km2','densidad',
    'es_zona_rural','pob_0_15','pob_16_64','pct_16_64','pob_65_mas','pct_65_mas',
    'anio_pob','anio_edad','anio_sup']
  const header = cols.join(SEP)
  const rows = dataset.map(m => [
    m.cod, `"${m.nombre}"`, `"${m.provincia}"`, `"${m.ccaa}"`,
    m.pob2025, m.sup_km2 ?? '', m.densidad ?? '',
    m.esRural ? 'SI' : 'NO',
    m.pob_0_15 ?? '', m.pob_16_64 ?? '', m.pct_16_64 ?? '',
    m.pob_65_mas ?? '', m.pct_65_mas ?? '',
    m.anio_pob, m.anio_edad, m.anio_sup
  ].join(SEP))
  return new Blob([BOM + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
}

export function toJSONBlob(dataset, filtro) {
  return new Blob([JSON.stringify({
    metadatos: {
      generado: new Date().toISOString().slice(0,10),
      filtro,
      fuentes: {
        poblacion:  'INE — Revisión Padrón Municipal 2025 (pobmun25.xlsx)',
        superficie: 'Ministerio Política Territorial — REL 2020 (esp_municipios_20200518.csv)',
        edad:       'INE — Nomenclátor Nacional 2025, hoja Edad (nomdef2025.xlsx) · ref. 1 enero 2025',
      },
      criterio: 'Ley 45/2007, art. 3: pob < 30.000 hab Y densidad < 100 hab/km²',
      licencia: 'CC BY 4.0 — Fuente: INE, www.ine.es',
    },
    municipios: dataset,
  }, null, 2)], { type: 'application/json' })
}
