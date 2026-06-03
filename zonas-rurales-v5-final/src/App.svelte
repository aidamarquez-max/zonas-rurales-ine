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

  // ── Definición de columnas opcionales ─────────────────────────────────────
  // Cada entrada: { id, label, descripcion }
  const COLS_OPCIONALES = [
    { id:'pob_16_64', label:'16–64',       desc:'Población en edad laboral (16–64 años)' },
    { id:'pob_65_mas',label:'65+',         desc:'Población mayor (65 y más años)' },
    { id:'paro',      label:'Paro abr.26', desc:'Paro registrado SEPE, abril 2026' },
    { id:'tasa_paro', label:'Tasa est.',   desc:'Tasa de paro estimada = paro / pob 16-64 (orientativa, ≠ tasa EPA)' },
    { id:'contratos', label:'Contratos',   desc:'Contratos registrados SEPE, abril 2026' },
  ]

  // Columnas visibles por defecto: tasa_paro y contratos ocultas
  let colsVisibles = new Set(['pob_16_64','pob_65_mas','paro'])
  let colsMenuAbierto = false

  function toggleCol(id) {
    const s = new Set(colsVisibles)
    s.has(id) ? s.delete(id) : s.add(id)
    colsVisibles = s
  }

  // ── Estado principal ───────────────────────────────────────────────────────
  let todos = [], dataset = [], filtrado = []

  // Clasificación: multiselección con Set
  // Opciones: 'rural', 'despoblado', 'no', 'nd'
  // 'despoblado' = rural AND densidad < 12.5
  let filtrosClasif = new Set(['rural','despoblado','no','nd'])  // por defecto: todos

  let selProv = '', buscar = '', tab = 'tabla'
  let pagina = 1; const POR_PAG = 50
  let cargando = true, error = ''

  // ── Clasificación de municipios ────────────────────────────────────────────
  function clasificar(m) {
    if (m.sinSuperficie)    return 'nd'
    if (!m.esRural)         return 'no'
    if (m.densidad < 12.5)  return 'despoblado'   // rural + densidad < 12,5
    return 'rural'                                  // rural pero no despoblado
  }

  onMount(async () => {
    try {
      todos = await cargarMunicipios()
      dataset = buildDataset(todos, null)
      aplicarFiltros()
      cargando = false
    } catch(e) { error = e.message; cargando = false }
  })

  function aplicarFiltros() {
    const bus = buscar.trim().toLowerCase()
    // Si están todas las opciones marcadas, no filtramos por clasificación
    const todasMarcadas = filtrosClasif.size === 4
    filtrado = dataset.filter(m => {
      const okC = todasMarcadas || filtrosClasif.has(clasificar(m))
      const okB = !bus || m.nombre.toLowerCase().includes(bus)
                       || m.provincia.toLowerCase().includes(bus)
      return okC && okB
    })
    pagina = 1
  }

  function toggleFiltro(val) {
    const s = new Set(filtrosClasif)
    s.has(val) ? s.delete(val) : s.add(val)
    filtrosClasif = s
    aplicarFiltros()
  }

  function cambiarProv() {
    dataset = buildDataset(todos, selProv || null)
    aplicarFiltros()
  }

  $: buscar, aplicarFiltros()
  $: paginas = Math.max(1, Math.ceil(filtrado.length / POR_PAG))
  $: filas = filtrado.slice((pagina-1)*POR_PAG, pagina*POR_PAG)

  // ── Métricas sobre el dataset completo (no filtrado) ───────────────────────
  $: rurales      = dataset.filter(m => m.esRural)
  $: despoblados  = dataset.filter(m => m.esRural && m.densidad < 12.5)
  $: pobRural     = rurales.reduce((s,m) => s + m.pob2025, 0)
  $: lab          = rurales.reduce((s,m) => s + (m.pob_16_64 ?? 0), 0)
  $: may          = rurales.reduce((s,m) => s + (m.pob_65_mas ?? 0), 0)
  $: paroRural    = rurales.reduce((s,m) => s + (m.paro_total ?? 0), 0)
  $: contrRural   = rurales.reduce((s,m) => s + (m.contr_total ?? 0), 0)
  $: tasaParo     = lab > 0 ? (paroRural / lab * 100).toFixed(1) : null
  $: pctR         = dataset.length ? ((rurales.length/dataset.length)*100).toFixed(0) : 0
  $: ccaas        = agruparCCAA(dataset)

  // Resumen del filtro activo para el toolbar
  $: resumenFiltro = (() => {
    if (filtrosClasif.size === 4) return 'todos'
    if (filtrosClasif.size === 0) return 'ninguno'
    const etiquetas = {
      rural:'rurales', despoblado:'despoblados', no:'no rurales', nd:'sin superficie'
    }
    return [...filtrosClasif].map(f => etiquetas[f]).join(' + ')
  })()

  function dl(blob, nombre) {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = nombre; a.click()
    URL.revokeObjectURL(a.href)
  }
  function dlCSV()  { dl(toCSV(filtrado),     `zonas_rurales_${selProv||'nacional'}.csv`) }
  function dlJSON() { dl(toJSONBlob(filtrado), `zonas_rurales_${selProv||'nacional'}.json`) }

  const fmt  = n => n != null ? n.toLocaleString('es-ES') : '—'
  const fmtD = n => n != null ? (+n).toFixed(1) : '—'

  // Cerrar menú columnas al hacer clic fuera
  function handleOutsideClick(e) {
    if (colsMenuAbierto && !e.target.closest('.cols-menu-wrap')) {
      colsMenuAbierto = false
    }
  }
</script>

<svelte:window on:click={handleOutsideClick} />

<div class="app">
  <header>
    <h1><span class="pill">Ley 45/2007</span> Zonas Rurales — España</h1>
    <p class="sub">
      <span class="dot g"></span>Población&nbsp;2025 ·
      <span class="dot a"></span>Superficie&nbsp;2020 ·
      <span class="dot v"></span>Edad&nbsp;2025 ·
      <span class="dot r"></span>Paro&nbsp;y&nbsp;contratos&nbsp;abril&nbsp;2026
    </p>
  </header>

  {#if error}
    <div class="alert-err">{error}</div>
  {:else if cargando}
    <div class="loading">Cargando datos…</div>
  {:else}

    <!-- ── Controles ───────────────────────────────────────────────────────── -->
    <div class="controles">

      <!-- Provincia -->
      <div class="ctrl">
        <label>Provincia</label>
        <select bind:value={selProv} on:change={cambiarProv}>
          {#each PROVINCIAS as p}<option value={p.cod}>{p.nombre}</option>{/each}
        </select>
      </div>

      <!-- Clasificación: multiselección con checkboxes visuales -->
      <div class="ctrl ctrl-clasif">
        <label>Clasificación <span class="label-hint">(selección múltiple)</span></label>
        <div class="check-group">
          {#each [
            { val:'rural',      label:'Rural',      title:'Pob <30.000 y densidad 12,5–100 hab/km²' },
            { val:'despoblado', label:'Despoblado',  title:'Rural con densidad <12,5 hab/km²' },
            { val:'no',         label:'No rural',    title:'No cumple criterios Ley 45/2007' },
            { val:'nd',         label:'Sin sup.',    title:'Sin superficie disponible, no clasificable' },
          ] as op}
            <button
              class="check-btn"
              class:active={filtrosClasif.has(op.val)}
              class:btn-despob={op.val==='despoblado'}
              class:btn-rural={op.val==='rural'}
              class:btn-no={op.val==='no'}
              class:btn-nd={op.val==='nd'}
              title={op.title}
              on:click={() => toggleFiltro(op.val)}
            >
              <span class="check-icon">{filtrosClasif.has(op.val) ? '✓' : ''}</span>
              {op.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Buscar -->
      <div class="ctrl">
        <label>Buscar</label>
        <input type="text" placeholder="Municipio o provincia…" bind:value={buscar} />
      </div>

    </div>

    <!-- ── Métricas ────────────────────────────────────────────────────────── -->
    <div class="metricas">
      <div class="met"><div class="ml">Municipios</div><div class="mv">{fmt(dataset.length)}</div></div>
      <div class="met">
        <div class="ml">Zona rural</div>
        <div class="mv green">{fmt(rurales.length)}</div>
        <div class="ms">{pctR}% del total</div>
      </div>
      <div class="met">
        <div class="ml">Despoblados</div>
        <div class="mv" style="color:#7a3a00">{fmt(despoblados.length)}</div>
        <div class="ms">densidad &lt;12,5</div>
      </div>
      <div class="met"><div class="ml">Pob. rural 2025</div><div class="mv">{fmt(pobRural)}</div></div>
      <div class="met">
        <div class="ml">16–64 años (rural)</div>
        <div class="mv blue">{fmt(lab)}</div>
        <div class="ms">{pobRural ? ((lab/pobRural)*100).toFixed(1)+'%' : ''}</div>
      </div>
      <div class="met">
        <div class="ml">65+ años (rural)</div>
        <div class="mv red">{fmt(may)}</div>
        <div class="ms">{pobRural ? ((may/pobRural)*100).toFixed(1)+'%' : ''}</div>
      </div>
      <div class="met">
        <div class="ml">Paro registrado (rural)</div>
        <div class="mv orange">{fmt(paroRural)}</div>
        <div class="ms">abril 2026</div>
      </div>
      <div class="met">
        <div class="ml">Contratos (rural)</div>
        <div class="mv">{fmt(contrRural)}</div>
        <div class="ms">abril 2026</div>
      </div>
    </div>

    <!-- ── Tabs ───────────────────────────────────────────────────────────── -->
    <div class="tabs">
      <button class="tab" class:active={tab==='tabla'}   on:click={()=>tab='tabla'}>Municipios ({filtrado.length.toLocaleString('es-ES')})</button>
      <button class="tab" class:active={tab==='empleo'}  on:click={()=>tab='empleo'}>Empleo por CCAA</button>
      <button class="tab" class:active={tab==='ccaa'}    on:click={()=>tab='ccaa'}>Demografía por CCAA</button>
      <button class="tab" class:active={tab==='fuentes'} on:click={()=>tab='fuentes'}>Fuentes</button>
    </div>

    <!-- ── TAB MUNICIPIOS ─────────────────────────────────────────────────── -->
    {#if tab === 'tabla'}
      <div class="toolbar">
        <span class="cnt">
          {filtrado.length.toLocaleString('es-ES')} municipios
          · {filtrado.filter(m=>clasificar(m)==='rural').length} rurales
          · {filtrado.filter(m=>clasificar(m)==='despoblado').length} despoblados
          {#if resumenFiltro !== 'todos'}<span class="filtro-activo">· filtro: {resumenFiltro}</span>{/if}
        </span>
        <div style="display:flex;gap:6px;align-items:center">

          <!-- Selector de columnas -->
          <div class="cols-menu-wrap">
            <button class="btn-sm" on:click|stopPropagation={() => colsMenuAbierto = !colsMenuAbierto}>
              Columnas ▾
            </button>
            {#if colsMenuAbierto}
              <div class="cols-menu" on:click|stopPropagation>
                <div class="cols-menu-title">Columnas visibles</div>
                {#each COLS_OPCIONALES as col}
                  <label class="cols-menu-item">
                    <input type="checkbox"
                      checked={colsVisibles.has(col.id)}
                      on:change={() => toggleCol(col.id)} />
                    <span>
                      <strong>{col.label}</strong>
                      <small>{col.desc}</small>
                    </span>
                  </label>
                {/each}
              </div>
            {/if}
          </div>

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
              <th class="r">Dens.</th>
              <th>Clasificación</th>
              {#if colsVisibles.has('pob_16_64')}<th class="r">16–64</th>{/if}
              {#if colsVisibles.has('pob_65_mas')}<th class="r">65+</th>{/if}
              {#if colsVisibles.has('paro')}<th class="r">Paro abr.26</th>{/if}
              {#if colsVisibles.has('tasa_paro')}<th class="r" title="Paro registrado / población 16-64 × 100. No equivale a la tasa EPA.">Tasa est. ⓘ</th>{/if}
              {#if colsVisibles.has('contratos')}<th class="r" title="Contratos registrados en el SEPE durante abril 2026 (flujo mensual).">Contratos ⓘ</th>{/if}
            </tr>
          </thead>
          <tbody>
            {#each filas as m (m.cod)}
              {@const cls = clasificar(m)}
              <tr class:rural={cls==='rural'} class:despoblado={cls==='despoblado'}>
                <td class="nom">{m.nombre}<span class="cod">{m.cod}</span></td>
                <td class="prov">{m.provincia}</td>
                <td class="r">{fmt(m.pob2025)}</td>
                <td class="r">{fmtD(m.densidad)}</td>
                <td>
                  {#if cls === 'nd'}
                    <span class="badge nd">sin sup.</span>
                  {:else if cls === 'despoblado'}
                    <span class="badge despob">◉ despoblado</span>
                  {:else if cls === 'rural'}
                    <span class="badge rural">✓ rural</span>
                  {:else}
                    <span class="badge no">no rural</span>
                  {/if}
                </td>
                {#if colsVisibles.has('pob_16_64')}<td class="r">{m.pob_16_64 != null ? fmt(m.pob_16_64) : '—'}</td>{/if}
                {#if colsVisibles.has('pob_65_mas')}<td class="r">{m.pob_65_mas != null ? fmt(m.pob_65_mas) : '—'}</td>{/if}
                {#if colsVisibles.has('paro')}<td class="r">{m.paro_total != null ? fmt(m.paro_total) : '—'}</td>{/if}
                {#if colsVisibles.has('tasa_paro')}<td class="r">{m.tasa_paro_est != null ? m.tasa_paro_est+'%' : '—'}</td>{/if}
                {#if colsVisibles.has('contratos')}<td class="r">{m.contr_total != null ? fmt(m.contr_total) : '—'}</td>{/if}
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
      <p class="nota-sepe">
        <strong>Despoblado:</strong> municipio rural con densidad &lt;12,5 hab/km² ·
        <strong>Rural:</strong> pob &lt;30.000 y densidad 12,5–100 hab/km² ·
        Tasa est. = paro registrado / pob 16-64 (orientativa, ≠ tasa EPA) ·
        Valores SEPE &lt;5 almacenados como 2.
      </p>
    {/if}

    <!-- ── TAB EMPLEO POR CCAA ─────────────────────────────────────────────── -->
    {#if tab === 'empleo'}
      <div class="tabla-wrap">
        <table>
          <thead>
            <tr>
              <th>CCAA</th>
              <th class="r">Munis rurales</th>
              <th class="r">Pob. rural</th>
              <th class="r">Pob. 16-64 rural</th>
              <th class="r">Paro rural abr.26</th>
              <th class="r">Tasa paro est.</th>
              <th class="r">Contratos rural abr.26</th>
            </tr>
          </thead>
          <tbody>
            {#each ccaas as g}
              <tr>
                <td class="nom">{g.ccaa}</td>
                <td class="r">{g.nRural}</td>
                <td class="r">{fmt(g.pobRural)}</td>
                <td class="r blue">{fmt(g.lab)}</td>
                <td class="r orange">{g.paro > 0 ? fmt(g.paro) : '—'}</td>
                <td class="r">{g.tasaParo != null && g.tasaParo > 0 ? g.tasaParo+'%' : '—'}</td>
                <td class="r">{g.contratos > 0 ? fmt(g.contratos) : '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <p class="nota-sepe">Tasa de paro estimada = paro registrado SEPE (abril 2026) / pob 16-64 (Nomenclátor 2025). No equivale a la tasa de paro EPA.</p>
    {/if}

    <!-- ── TAB DEMOGRAFÍA POR CCAA ────────────────────────────────────────── -->
    {#if tab === 'ccaa'}
      <div class="tabla-wrap">
        <table>
          <thead>
            <tr>
              <th>CCAA</th>
              <th class="r">Total munis</th>
              <th class="r">Rurales</th>
              <th class="r">% rural</th>
              <th class="r">Pob. rural</th>
              <th class="r">16–64</th>
              <th class="r">% lab.</th>
              <th class="r">65+</th>
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

    <!-- ── TAB FUENTES ────────────────────────────────────────────────────── -->
    {#if tab === 'fuentes'}
      <div class="fuentes">
        {#each [
          { dot:'g', tipo:'Población — 1 enero 2025',
            titulo:'INE — Revisión del Padrón Municipal 2025',
            code:'pobmun25.xlsx · 8.132 municipios · publicado 11/12/2025',
            url:'https://www.ine.es/pob_xls/pobmun.zip',
            nota:'Fuente de población más actualizada. Se publica cada diciembre.' },
          { dot:'a', tipo:'Superficie km² — 2020',
            titulo:'Ministerio de Política Territorial — Registro de Entidades Locales (REL)',
            code:'esp_municipios_20200518.csv · 8.132 municipios',
            url:'https://www.mptfp.gob.es/portal/politica-territorial/local/sistema_de_informacion_local_-SIL-/registro_de_entidades_locales.html',
            nota:'La superficie cambia solo en fusiones/segregaciones. Los datos de 2020 son válidos para el 99,99% de municipios actuales.' },
          { dot:'v', tipo:'Grupos de edad — 1 enero 2025',
            titulo:'INE — Nomenclátor Nacional 2025, hoja Edad',
            code:'nomdef2025.xlsx · 8.132 municipios · grupos: 0-15, 16-64, 65+',
            url:'https://www.ine.es/dyngs/INEbase/operacion.htm?c=Estadistica_C&cid=1254736177010&idp=1254735572981',
            nota:'Dato más reciente disponible para grupos de edad a nivel municipal.' },
          { dot:'r', tipo:'Paro registrado — abril 2026',
            titulo:'SEPE — Estadísticas de Paro Registrado por Municipios',
            code:'PARO_MUNICIPIOS_ABRIL26.xlsx · 8.135 municipios',
            url:'https://www.sepe.es/HomeSepe/que-es-el-sepe/estadisticas/datos-estadisticos/paro/datos-municipios.html',
            nota:'Paro registrado en las oficinas del SEPE. No es la tasa de paro de la EPA. Valores entre 1 y 4 almacenados como 2 por confidencialidad.' },
          { dot:'r', tipo:'Contratos registrados — abril 2026',
            titulo:'SEPE — Estadísticas de Contratos Registrados por Municipios',
            code:'PARO_MUNICIPIOS_ABRIL26.xlsx (hojas CONTRATOS) · abril 2026',
            url:'https://www.sepe.es/HomeSepe/que-es-el-sepe/estadisticas/datos-estadisticos/contratos/datos-municipios.html',
            nota:'Contratos comunicados al SEPE en el mes. Flujo mensual, no stock acumulado.' },
          { dot:'', tipo:'Marco legal — clasificación',
            titulo:'Ley 45/2007, de 13 de diciembre — Artículo 3',
            code:'Rural: pob <30.000 hab Y densidad <100 hab/km² · Despoblado: rural Y densidad <12,5 hab/km²',
            url:'https://www.boe.es/eli/es/l/2007/12/13/45/con',
            nota:'La delimitación formal de zonas rurales corresponde a las CCAA mediante sus Programas de Desarrollo Rural. Esta app identifica municipios candidatos individualmente, no sustituye al acto administrativo autonómico. El umbral de 12,5 hab/km² para "despoblado" es el criterio técnico comúnmente aceptado en la literatura sobre despoblación rural en España.' },
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
      Datos: <a href="https://www.ine.es" target="_blank">INE</a> ·
      <a href="https://www.sepe.es" target="_blank">SEPE</a> ·
      Ministerio de Política Territorial ·
      Licencia CC BY 4.0 ·
      <a href="https://www.boe.es/eli/es/l/2007/12/13/45/con" target="_blank">Ley 45/2007</a>
    </footer>
  {/if}
</div>

<style>
  :global(*){box-sizing:border-box;margin:0;padding:0}
  :global(body){font-family:Georgia,serif;font-size:14px;line-height:1.5;background:#f8f7f4;color:#1a1a18}
  .app{max-width:1200px;margin:0 auto;padding:24px 16px 48px}

  header{border-bottom:1.5px solid #1a1a18;padding-bottom:14px;margin-bottom:20px}
  h1{font-size:20px;font-weight:normal}
  .pill{display:inline-block;font-family:'Courier New',monospace;font-size:11px;background:#1a1a18;color:#f8f7f4;padding:2px 8px;border-radius:3px;margin-right:8px}
  .sub{font-size:12px;color:#6a6a62;font-family:'Courier New',monospace;margin-top:4px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .dot{display:inline-block;width:8px;height:8px;border-radius:50%;vertical-align:middle;flex-shrink:0}
  .dot.g{background:#2d7a4f}.dot.a{background:#b87000}.dot.v{background:#1a4e8c}.dot.r{background:#b84000}

  /* Controles */
  .controles{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px}
  .ctrl{display:flex;flex-direction:column;gap:4px}
  .ctrl label{font-size:11px;font-family:'Courier New',monospace;color:#6a6a62;text-transform:uppercase;letter-spacing:.4px}
  .ctrl select,.ctrl input{padding:7px 9px;border:1px solid rgba(26,26,24,.25);border-radius:6px;background:white;font-size:13px;font-family:inherit}
  .label-hint{text-transform:none;letter-spacing:0;font-size:10px;color:#9a9a92}

  /* Multiselect checkboxes */
  .check-group{display:flex;flex-wrap:wrap;gap:5px}
  .check-btn{
    display:inline-flex;align-items:center;gap:4px;
    padding:5px 10px;font-size:12px;border-radius:5px;
    border:1px solid rgba(26,26,24,.25);background:white;
    cursor:pointer;font-family:'Courier New',monospace;
    color:#6a6a62;transition:all .12s;user-select:none;
  }
  .check-btn:hover{border-color:rgba(26,26,24,.5)}
  .check-icon{font-size:10px;width:10px;display:inline-block}

  /* Colores activos por categoría */
  .check-btn.btn-rural.active  {background:#e5f5eb;border-color:#2d7a4f;color:#1a5e34}
  .check-btn.btn-despob.active {background:#fff0e0;border-color:#7a3a00;color:#7a3a00}
  .check-btn.btn-no.active     {background:#fae8e5;border-color:#8b1a0a;color:#8b1a0a}
  .check-btn.btn-nd.active     {background:#f0ede5;border-color:#6a6a62;color:#4a4a42}

  /* Métricas */
  .metricas{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-bottom:14px}
  .met{background:white;border:1px solid rgba(26,26,24,.1);border-radius:10px;padding:10px 12px}
  .ml{font-size:10px;font-family:'Courier New',monospace;color:#6a6a62;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px}
  .mv{font-size:20px;letter-spacing:-1px}.ms{font-size:11px;color:#6a6a62;margin-top:2px}
  .green{color:#2d7a4f}.blue{color:#1a4e8c}.red{color:#8b1a0a}.orange{color:#b84000}

  /* Tabs */
  .tabs{display:flex;border-bottom:1px solid rgba(26,26,24,.2);margin-bottom:14px;flex-wrap:wrap}
  .tab{padding:8px 14px;font-size:12px;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;color:#6a6a62;font-family:'Courier New',monospace}
  .tab.active{color:#1a1a18;border-bottom-color:#1a1a18}

  /* Toolbar */
  .toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px}
  .cnt{font-size:12px;color:#6a6a62;font-family:'Courier New',monospace}
  .filtro-activo{color:#b84000}
  .btn-sm{padding:5px 12px;font-size:12px;border:1px solid rgba(26,26,24,.25);border-radius:6px;background:white;cursor:pointer;font-family:'Courier New',monospace}
  .btn-sm:hover{background:#f0ede5}

  /* Menú de columnas */
  .cols-menu-wrap{position:relative}
  .cols-menu{
    position:absolute;right:0;top:calc(100% + 4px);z-index:100;
    background:white;border:1px solid rgba(26,26,24,.18);border-radius:8px;
    padding:10px 0;min-width:260px;box-shadow:0 4px 16px rgba(0,0,0,.1);
  }
  .cols-menu-title{
    font-size:10px;font-family:'Courier New',monospace;text-transform:uppercase;
    letter-spacing:.5px;color:#6a6a62;padding:0 14px 8px;
    border-bottom:1px solid rgba(26,26,24,.08);margin-bottom:4px;
  }
  .cols-menu-item{
    display:flex;align-items:flex-start;gap:10px;padding:7px 14px;cursor:pointer;
    font-size:12px;
  }
  .cols-menu-item:hover{background:#f7f5f0}
  .cols-menu-item input{margin-top:2px;flex-shrink:0;cursor:pointer}
  .cols-menu-item span{display:flex;flex-direction:column;gap:2px}
  .cols-menu-item strong{font-size:12px;font-weight:500;color:#1a1a18}
  .cols-menu-item small{font-size:11px;color:#6a6a62;font-family:'Courier New',monospace}

  /* Tabla */
  .tabla-wrap{border:1px solid rgba(26,26,24,.12);border-radius:10px;overflow:hidden;overflow-x:auto}
  table{width:100%;border-collapse:collapse;font-size:12px}
  thead th{background:#f0ede5;padding:8px 10px;text-align:left;font-size:10px;font-family:'Courier New',monospace;text-transform:uppercase;letter-spacing:.4px;color:#4a4a42;border-bottom:1px solid rgba(26,26,24,.18);font-weight:normal;white-space:nowrap;cursor:default}
  tbody td{padding:7px 10px;border-bottom:1px solid rgba(26,26,24,.07);vertical-align:middle}
  tbody tr:last-child td{border-bottom:none}
  tbody tr:hover{background:#f7f5f0}
  tbody tr.rural{background:#f3faf5}
  tbody tr.despoblado{background:#fff7ed}
  .r{text-align:right}
  .nom{font-weight:500;min-width:140px}
  .prov{font-size:11px;color:#6a6a62}
  .cod{display:block;font-size:10px;color:#9a9a92;font-family:'Courier New',monospace;font-weight:normal}

  /* Badges */
  .badge{display:inline-block;font-size:10px;padding:2px 7px;border-radius:3px;font-family:'Courier New',monospace;white-space:nowrap}
  .badge.rural  {background:#e5f5eb;color:#1a5e34}
  .badge.despob {background:#fff0e0;color:#7a3a00;border:1px solid #f0c080}
  .badge.no     {background:#fae8e5;color:#8b1a0a}
  .badge.nd     {background:#f0ede5;color:#6a6a62}

  /* Paginación */
  .pag{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap}
  .pag button{padding:4px 10px;font-size:12px;border-radius:6px;border:1px solid rgba(26,26,24,.2);background:white;cursor:pointer;font-family:'Courier New',monospace}
  .pag button:disabled{opacity:.3;cursor:not-allowed}
  .pag span{font-size:12px;color:#6a6a62;font-family:'Courier New',monospace}

  .nota-sepe{font-size:11px;color:#6a6a62;font-family:'Courier New',monospace;margin-top:8px;padding:6px 10px;background:#fdf8f0;border-radius:4px;line-height:1.6}

  /* Fuentes */
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

  @media(max-width:700px){
    .controles{grid-template-columns:1fr}
    .metricas{grid-template-columns:repeat(2,1fr)}
  }
</style>
