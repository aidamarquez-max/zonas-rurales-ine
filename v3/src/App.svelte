<script>
  import { onMount } from 'svelte'
  import { cargarMunicipios, buildDataset, agruparCCAA, toCSV, toJSONBlob } from './lib/ine.js'

  const PROVINCIAS = [
    {cod:'',nombre:'— Todas las provincias —'},
    {cod:'01',nombre:'Araba/Álava'},{cod:'02',nombre:'Albacete'},
    {cod:'03',nombre:'Alicante/Alacant'},{cod:'04',nombre:'Almería'},
    {cod:'05',nombre:'Ávila'},{cod:'06',nombre:'Badajoz'},
    {cod:'07',nombre:'Balears, Illes'},{cod:'08',nombre:'Barcelona'},
    {cod:'09',nombre:'Burgos'},{cod:'10',nombre:'Cáceres'},
    {cod:'11',nombre:'Cádiz'},{cod:'12',nombre:'Castellón/Castelló'},
    {cod:'13',nombre:'Ciudad Real'},{cod:'14',nombre:'Córdoba'},
    {cod:'15',nombre:'Coruña, A'},{cod:'16',nombre:'Cuenca'},
    {cod:'17',nombre:'Girona'},{cod:'18',nombre:'Granada'},
    {cod:'19',nombre:'Guadalajara'},{cod:'20',nombre:'Gipuzkoa'},
    {cod:'21',nombre:'Huelva'},{cod:'22',nombre:'Huesca'},
    {cod:'23',nombre:'Jaén'},{cod:'24',nombre:'León'},
    {cod:'25',nombre:'Lleida'},{cod:'26',nombre:'Rioja, La'},
    {cod:'27',nombre:'Lugo'},{cod:'28',nombre:'Madrid'},
    {cod:'29',nombre:'Málaga'},{cod:'30',nombre:'Murcia'},
    {cod:'31',nombre:'Navarra'},{cod:'32',nombre:'Ourense'},
    {cod:'33',nombre:'Asturias'},{cod:'34',nombre:'Palencia'},
    {cod:'35',nombre:'Palmas, Las'},{cod:'36',nombre:'Pontevedra'},
    {cod:'37',nombre:'Salamanca'},{cod:'38',nombre:'S.C. de Tenerife'},
    {cod:'39',nombre:'Cantabria'},{cod:'40',nombre:'Segovia'},
    {cod:'41',nombre:'Sevilla'},{cod:'42',nombre:'Soria'},
    {cod:'43',nombre:'Tarragona'},{cod:'44',nombre:'Teruel'},
    {cod:'45',nombre:'Toledo'},{cod:'46',nombre:'Valencia/València'},
    {cod:'47',nombre:'Valladolid'},{cod:'48',nombre:'Bizkaia'},
    {cod:'49',nombre:'Zamora'},{cod:'50',nombre:'Zaragoza'},
    {cod:'51',nombre:'Ceuta'},{cod:'52',nombre:'Melilla'},
  ]

  // ── Estado ─────────────────────────────────────────────────────────────────
  let todos = []          // 8132 municipios cargados
  let dataset = []        // filtrados por provincia
  let filtrado = []       // filtrados por clasificación + búsqueda

  let selProv = ''
  let filtroClasif = 'all'
  let buscar = ''
  let tab = 'tabla'
  let pagina = 1
  const POR_PAG = 50

  let cargando = true
  let error = ''

  onMount(async () => {
    try {
      todos = await cargarMunicipios()
      dataset = buildDataset(todos, null)
      aplicarFiltros()
      cargando = false
    } catch(e) {
      error = e.message
      cargando = false
    }
  })

  // ── Filtros ────────────────────────────────────────────────────────────────
  function aplicarFiltros() {
    const bus = buscar.trim().toLowerCase()
    filtrado = dataset.filter(m => {
      const okC = filtroClasif === 'all'
        || (filtroClasif === 'rural' && m.esRural)
        || (filtroClasif === 'no' && !m.esRural && !m.sinSuperficie)
        || (filtroClasif === 'nd' && m.sinSuperficie)
      const okB = !bus || m.nombre.toLowerCase().includes(bus) || m.provincia.toLowerCase().includes(bus)
      return okC && okB
    })
    pagina = 1
  }

  function cambiarProv() {
    dataset = buildDataset(todos, selProv || null)
    aplicarFiltros()
  }

  $: filtroClasif, buscar, aplicarFiltros()

  // ── Paginación ─────────────────────────────────────────────────────────────
  $: paginas = Math.max(1, Math.ceil(filtrado.length / POR_PAG))
  $: filas = filtrado.slice((pagina-1)*POR_PAG, pagina*POR_PAG)

  // ── Métricas ───────────────────────────────────────────────────────────────
  $: rurales    = dataset.filter(m => m.esRural)
  $: pobRural   = rurales.reduce((s,m) => s + m.pob2025, 0)
  $: lab        = rurales.reduce((s,m) => s + (m.pob_16_64 ?? 0), 0)
  $: may        = rurales.reduce((s,m) => s + (m.pob_65_mas ?? 0), 0)
  $: pctR       = dataset.length ? ((rurales.length/dataset.length)*100).toFixed(0) : 0

  // ── Resumen CCAA ───────────────────────────────────────────────────────────
  $: ccaas = agruparCCAA(dataset)

  // ── Exportar ───────────────────────────────────────────────────────────────
  function dl(blob, nombre) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = nombre
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function dlCSV()  { dl(toCSV(filtrado), `zonas_rurales_${selProv||'nacional'}.csv`) }
  function dlJSON() { dl(toJSONBlob(filtrado, selProv||'nacional'), `zonas_rurales_${selProv||'nacional'}.json`) }

  const fmt  = n => n != null ? n.toLocaleString('es-ES') : '—'
  const fmtD = n => n != null ? (+n).toFixed(1) : '—'
</script>

<div class="app">

  <header>
    <h1><span class="pill">Ley 45/2007</span> Zonas Rurales — España</h1>
    <p class="sub">
      Zona rural: pob &lt;30.000 hab y densidad &lt;100 hab/km² ·
      <span class="dot g"></span>Población: INE Padrón 2025 ·
      <span class="dot a"></span>Superficie: REL 2020 ·
      <span class="dot v"></span>Edad: INE Nomenclátor 2025
    </p>
  </header>

  {#if error}
    <div class="alert-err">Error cargando datos: {error}</div>
  {:else if cargando}
    <div class="loading">Cargando {todos.length ? todos.length.toLocaleString('es-ES')+' municipios…' : 'datos…'}</div>
  {:else}

    <!-- Controles -->
    <div class="controles">
      <div class="ctrl">
        <label>Provincia</label>
        <select bind:value={selProv} on:change={cambiarProv}>
          {#each PROVINCIAS as p}<option value={p.cod}>{p.nombre}</option>{/each}
        </select>
      </div>
      <div class="ctrl">
        <label>Clasificación</label>
        <select bind:value={filtroClasif}>
          <option value="all">Todos</option>
          <option value="rural">Solo rurales</option>
          <option value="no">Solo no rurales</option>
          <option value="nd">Sin superficie</option>
        </select>
      </div>
      <div class="ctrl">
        <label>Buscar</label>
        <input type="text" placeholder="Municipio o provincia…" bind:value={buscar} />
      </div>
    </div>

    <!-- Métricas -->
    <div class="metricas">
      <div class="met"><div class="ml">Municipios</div><div class="mv">{fmt(dataset.length)}</div></div>
      <div class="met"><div class="ml">Zonas rurales</div><div class="mv green">{fmt(rurales.length)}</div><div class="ms">{pctR}%</div></div>
      <div class="met"><div class="ml">Pob. rural 2025</div><div class="mv">{fmt(pobRural)}</div><div class="ms">hab.</div></div>
      <div class="met"><div class="ml">16–64 años (rural)</div><div class="mv blue">{fmt(lab)}</div><div class="ms">{pobRural ? ((lab/pobRural)*100).toFixed(1)+'%' : '—'}</div></div>
      <div class="met"><div class="ml">65+ años (rural)</div><div class="mv red">{fmt(may)}</div><div class="ms">{pobRural ? ((may/pobRural)*100).toFixed(1)+'%' : '—'}</div></div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" class:active={tab==='tabla'}   on:click={()=>tab='tabla'}>Municipios ({filtrado.length.toLocaleString('es-ES')})</button>
      <button class="tab" class:active={tab==='ccaa'}    on:click={()=>tab='ccaa'}>Por CCAA</button>
      <button class="tab" class:active={tab==='fuentes'} on:click={()=>tab='fuentes'}>Fuentes</button>
    </div>

    <!-- TAB TABLA ─────────────────────────────────────────────── -->
    {#if tab === 'tabla'}
      <div class="toolbar">
        <span class="cnt">{filtrado.length.toLocaleString('es-ES')} municipios · {filtrado.filter(m=>m.esRural).length} rurales</span>
        <div style="display:flex;gap:6px">
          <button class="btn-sm" on:click={dlCSV}>↓ CSV</button>
          <button class="btn-sm" on:click={dlJSON}>↓ JSON</button>
        </div>
      </div>
      <div class="tabla-wrap">
        <table>
          <thead>
            <tr>
              <th>Municipio</th>
              <th>Provincia</th>
              <th class="r">Pob. 2025</th>
              <th class="r">Sup. km²</th>
              <th class="r">Densidad</th>
              <th>Zona rural</th>
              <th class="r">16–64</th>
              <th class="r">% lab.</th>
              <th class="r">65+</th>
              <th class="r">% dep.</th>
            </tr>
          </thead>
          <tbody>
            {#each filas as m (m.cod)}
              <tr class:rural={m.esRural}>
                <td class="nom">{m.nombre}<span class="cod">{m.cod}</span></td>
                <td class="prov">{m.provincia}</td>
                <td class="r">{fmt(m.pob2025)}</td>
                <td class="r">{m.sup_km2 != null ? fmtD(m.sup_km2) : '—'}</td>
                <td class="r">{m.densidad != null ? fmtD(m.densidad) : '—'}</td>
                <td>
                  {#if m.sinSuperficie}<span class="badge nd">sin sup.</span>
                  {:else if m.esRural}<span class="badge rural">✓ rural</span>
                  {:else}<span class="badge no">no rural</span>{/if}
                </td>
                <td class="r">{m.pob_16_64 != null ? fmt(m.pob_16_64) : '—'}</td>
                <td class="r">{m.pct_16_64 != null ? m.pct_16_64+'%' : '—'}</td>
                <td class="r">{m.pob_65_mas != null ? fmt(m.pob_65_mas) : '—'}</td>
                <td class="r">{m.pct_65_mas != null ? m.pct_65_mas+'%' : '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="pag">
        <button on:click={()=>pagina--} disabled={pagina<=1}>← Anterior</button>
        <span>Pág. {pagina} / {paginas}</span>
        <button on:click={()=>pagina++} disabled={pagina>=paginas}>Siguiente →</button>
        <span style="margin-left:auto;color:#6a6a62">{filtrado.length.toLocaleString('es-ES')} registros</span>
      </div>
    {/if}

    <!-- TAB CCAA ──────────────────────────────────────────────── -->
    {#if tab === 'ccaa'}
      <div class="tabla-wrap">
        <table>
          <thead>
            <tr>
              <th>CCAA</th>
              <th class="r">Municipios</th>
              <th class="r">Rurales</th>
              <th class="r">% rural</th>
              <th class="r">Pob. rural</th>
              <th class="r">16–64 (rural)</th>
              <th class="r">% lab.</th>
              <th class="r">65+ (rural)</th>
              <th class="r">% dep.</th>
            </tr>
          </thead>
          <tbody>
            {#each ccaas as g}
              <tr>
                <td class="nom">{g.ccaa}</td>
                <td class="r">{g.nTotal}</td>
                <td class="r green">{g.nRural}</td>
                <td class="r">{g.pctRural}%</td>
                <td class="r">{fmt(g.pobRural)}</td>
                <td class="r blue">{g.lab > 0 ? fmt(g.lab) : '—'}</td>
                <td class="r">{g.pctLab > 0 ? g.pctLab+'%' : '—'}</td>
                <td class="r red">{g.may > 0 ? fmt(g.may) : '—'}</td>
                <td class="r">{g.pctMay > 0 ? g.pctMay+'%' : '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <!-- TAB FUENTES ───────────────────────────────────────────── -->
    {#if tab === 'fuentes'}
      <div class="fuentes">
        {#each [
          { dot:'g', tipo:'Población — 1 enero 2025',
            titulo:'INE — Cifras Oficiales de Población: Revisión del Padrón Municipal 2025',
            code:'pobmun25.xlsx · 8.132 municipios · publicado 11/12/2025',
            url:'https://www.ine.es/pob_xls/pobmun.zip',
            nota:'Fuente más actualizada disponible. Se publica cada diciembre con referencia a 1 enero.' },
          { dot:'a', tipo:'Superficie km² — referencia 2020',
            titulo:'Ministerio de Política Territorial — Registro de Entidades Locales (REL)',
            code:'esp_municipios_20200518.csv · 8.132 municipios',
            url:'https://www.mptfp.gob.es/portal/politica-territorial/local/sistema_de_informacion_local_-SIL-/registro_de_entidades_locales.html',
            nota:'La superficie municipal cambia muy raramente (fusiones, segregaciones). Los datos de 2020 son válidos para el 99,9% de los municipios actuales. Solo 1 municipio sin superficie (fusión posterior a 2020).' },
          { dot:'v', tipo:'Grupos de edad — 1 enero 2025',
            titulo:'INE — Nomenclátor Nacional 2025: Población por unidad poblacional (hoja Edad)',
            code:'nomdef2025.xlsx · 8.132 municipios · grupos: 0-15, 16-64, 65+ · publicado 28/01/2026',
            url:'https://www.ine.es/dyngs/INEbase/operacion.htm?c=Estadistica_C&cid=1254736177010&idp=1254735572981',
            nota:'La hoja Edad del Nomenclátor 2025 contiene los grupos de edad para todos los municipios referenciados a 1 de enero de 2025. Es la fuente más actualizada disponible para datos de edad municipal.' },
          { dot:'', tipo:'Marco legal',
            titulo:'Ley 45/2007, de 13 de diciembre, para el desarrollo sostenible del medio rural — Art. 3',
            code:'Criterios: población < 30.000 hab. Y densidad < 100 hab/km²',
            url:'https://www.boe.es/eli/es/l/2007/12/13/45/con',
            nota:'La delimitación formal de zonas rurales corresponde a las CCAA. Esta app identifica los municipios candidatos; no sustituye al acto administrativo de delimitación.' },
        ] as f}
          <div class="fuente-card">
            <div class="f-tipo">{#if f.dot}<span class="dot {f.dot}"></span>{/if}{f.tipo}</div>
            <div class="f-titulo">{f.titulo}</div>
            <code>{f.code}</code>
            <a href={f.url} target="_blank" rel="noopener">{f.url}</a>
            <p class="f-nota">{f.nota}</p>
          </div>
        {/each}
      </div>
    {/if}

    <footer>
      Datos: <a href="https://www.ine.es" target="_blank">INE</a> (CC BY 4.0) ·
      <a href="https://www.boe.es/eli/es/l/2007/12/13/45/con" target="_blank">Ley 45/2007</a> ·
      App 100% offline · Sin llamadas a APIs externas
    </footer>

  {/if}
</div>

<style>
  :global(*){box-sizing:border-box;margin:0;padding:0}
  :global(body){font-family:Georgia,serif;font-size:14px;line-height:1.5;background:#f8f7f4;color:#1a1a18}
  .app{max-width:1140px;margin:0 auto;padding:24px 16px 48px}

  header{border-bottom:1.5px solid #1a1a18;padding-bottom:14px;margin-bottom:20px}
  h1{font-size:20px;font-weight:normal}
  .pill{display:inline-block;font-family:'Courier New',monospace;font-size:11px;background:#1a1a18;color:#f8f7f4;padding:2px 8px;border-radius:3px;margin-right:8px}
  .sub{font-size:12px;color:#6a6a62;font-family:'Courier New',monospace;margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .dot{display:inline-block;width:8px;height:8px;border-radius:50%;vertical-align:middle}
  .dot.g{background:#2d7a4f}.dot.a{background:#b87000}.dot.v{background:#1a4e8c}

  .controles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:14px}
  .ctrl{display:flex;flex-direction:column;gap:4px}
  .ctrl label{font-size:11px;font-family:'Courier New',monospace;color:#6a6a62;text-transform:uppercase;letter-spacing:.4px}
  .ctrl select,.ctrl input{padding:7px 9px;border:1px solid rgba(26,26,24,.25);border-radius:6px;background:white;font-size:13px;font-family:inherit}

  .metricas{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:14px}
  .met{background:white;border:1px solid rgba(26,26,24,.1);border-radius:10px;padding:12px 14px}
  .ml{font-size:10px;font-family:'Courier New',monospace;color:#6a6a62;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
  .mv{font-size:22px;letter-spacing:-1px}.ms{font-size:11px;color:#6a6a62;margin-top:2px}
  .green{color:#2d7a4f}.blue{color:#1a4e8c}.red{color:#8b1a0a}

  .tabs{display:flex;border-bottom:1px solid rgba(26,26,24,.2);margin-bottom:14px}
  .tab{padding:8px 16px;font-size:13px;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;color:#6a6a62;font-family:'Courier New',monospace}
  .tab.active{color:#1a1a18;border-bottom-color:#1a1a18}

  .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px}
  .cnt{font-size:12px;color:#6a6a62;font-family:'Courier New',monospace}
  .btn-sm{padding:5px 12px;font-size:12px;border:1px solid rgba(26,26,24,.25);border-radius:6px;background:white;cursor:pointer;font-family:'Courier New',monospace}
  .btn-sm:hover{background:#f0ede5}

  .tabla-wrap{border:1px solid rgba(26,26,24,.12);border-radius:10px;overflow:hidden;overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:12px}
  thead th{background:#f0ede5;padding:8px 10px;text-align:left;font-size:10px;font-family:'Courier New',monospace;text-transform:uppercase;letter-spacing:.4px;color:#4a4a42;border-bottom:1px solid rgba(26,26,24,.18);font-weight:normal;white-space:nowrap}
  tbody td{padding:7px 10px;border-bottom:1px solid rgba(26,26,24,.07);vertical-align:middle}
  tbody tr:last-child td{border-bottom:none}
  tbody tr:hover{background:#f7f5f0}
  tbody tr.rural{background:#f3faf5}
  .r{text-align:right}
  .nom{font-weight:500;min-width:140px}
  .prov{font-size:11px;color:#6a6a62}
  .cod{display:block;font-size:10px;color:#9a9a92;font-family:'Courier New',monospace;font-weight:normal}
  .badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:3px;font-family:'Courier New',monospace}
  .badge.rural{background:#e5f5eb;color:#1a5e34}
  .badge.no{background:#fae8e5;color:#8b1a0a}
  .badge.nd{background:#f0ede5;color:#6a6a62}

  .pag{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap}
  .pag button{padding:4px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(26,26,24,.2);background:white;cursor:pointer;font-family:'Courier New',monospace}
  .pag button:disabled{opacity:.3;cursor:not-allowed}
  .pag span{font-size:12px;color:#6a6a62;font-family:'Courier New',monospace}

  .fuentes{display:flex;flex-direction:column;gap:12px}
  .fuente-card{background:white;border:1px solid rgba(26,26,24,.1);border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:6px}
  .f-tipo{font-size:11px;font-family:'Courier New',monospace;color:#6a6a62;text-transform:uppercase;letter-spacing:.4px;display:flex;align-items:center;gap:6px}
  .f-titulo{font-size:13px;font-weight:500}
  .fuente-card code{font-size:11px;background:#f0ede5;padding:5px 10px;border-radius:4px;font-family:'Courier New',monospace;color:#4a4a42}
  .fuente-card a{font-size:11px;color:#1a4e8c;word-break:break-all}
  .f-nota{font-size:12px;color:#6a6a62}

  .loading{text-align:center;padding:40px;color:#6a6a62;font-family:'Courier New',monospace}
  .alert-err{background:#fae8e5;border:1px solid #d97c6e;border-radius:8px;padding:10px 14px;font-size:12px;color:#8b1a0a;margin-bottom:14px}

  footer{margin-top:32px;padding-top:14px;border-top:1px solid rgba(26,26,24,.12);font-size:12px;color:#6a6a62;font-family:'Courier New',monospace}
  footer a{color:#1a4e8c}
  @media(max-width:640px){.metricas{grid-template-columns:repeat(2,1fr)}}
</style>
