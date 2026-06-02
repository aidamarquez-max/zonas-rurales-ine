# Zonas Rurales España — Ley 45/2007

Aplicación Svelte para clasificar los 8.132 municipios de España según el
criterio de zona rural establecido por la Ley 45/2007. **100% offline**,
sin llamadas a APIs externas.

---

## Criterio legal aplicado

> *«Se entiende por zona rural el espacio geográfico formado por la
> agregación de municipios o entidades locales menores definido por las
> administraciones competentes que posean una **población inferior a 30.000
> habitantes** y una **densidad inferior a los 100 habitantes por km²**»*
>
> — Ley 45/2007, de 13 de diciembre, art. 3
> · [BOE](https://www.boe.es/eli/es/l/2007/12/13/45/con)

**Nota metodológica:** la Ley prevé que la zona rural es la *agregación*
de municipios candidatos y que la delimitación formal corresponde a cada
Comunidad Autónoma. Esta app identifica los municipios que cumplen ambos
criterios individualmente; no sustituye al acto administrativo de delimitación
autonómica.

---

## Ficheros fuente utilizados

### 1. `data/pobmun.zip` — Población oficial por municipio

| Campo | Valor |
|---|---|
| **Fuente** | INE — Cifras Oficiales de Población de los Municipios Españoles |
| **Operación** | Revisión del Padrón Municipal |
| **Fecha de referencia** | 1 de enero de 2025 |
| **Fecha de publicación** | 11 de diciembre de 2025 |
| **Fichero activo dentro del ZIP** | `pobmun25.xlsx` |
| **Cobertura** | 8.132 municipios · 52 provincias · toda España |
| **Descarga** | https://www.ine.es/pob_xls/pobmun.zip |
| **Licencia** | CC BY 4.0 · Fuente: INE, www.ine.es |

**Columnas del Excel:**

| Columna | Descripción |
|---|---|
| `CPRO` | Código de provincia (2 dígitos) |
| `PROVINCIA` | Nombre de la provincia |
| `CMUN` | Código de municipio (3 dígitos) |
| `NOMBRE` | Denominación oficial del municipio |
| `POB25` | Población total a 1 enero 2025 |
| `HOMBRES` | Población masculina |
| `MUJERES` | Población femenina |

**Estadísticas:**
- Población total España: **49.114.494 habitantes**
- El ZIP contiene también los ficheros históricos 1996–2024

---

### 2. `data/esp_municipios_20200518.csv` — Superficie km² por municipio

| Campo | Valor |
|---|---|
| **Fuente** | Ministerio de Política Territorial — Registro de Entidades Locales (REL) |
| **Fecha de referencia** | 18 de mayo de 2020 |
| **Cobertura** | 8.132 municipios · toda España |
| **Descarga** | https://www.mptfp.gob.es/portal/politica-territorial/local/sistema_de_informacion_local_-SIL-/registro_de_entidades_locales.html |
| **Licencia** | Datos abiertos, reutilización libre con cita |

**Columnas del CSV (separador: coma):**

| Columna | Descripción |
|---|---|
| `CODIGO_CA` | Código de Comunidad Autónoma |
| `COMUNIDAD_AUTONOMA` | Nombre de la CCAA |
| `Codigo Provincia` | Código interno del REL |
| `PROVINCIA` | Nombre de la provincia |
| `NUMERO_INSCRIPCION` | Código REL del municipio |
| `Codigo Municipio` | Código interno REL |
| `DENOMINACION` | Nombre del municipio |
| `FECHA_INSCRIPCION` | Fecha de inscripción en el registro |
| **`SUPERFICIE`** | **Superficie en km² (separador decimal: coma)** |
| `HABITANTES` | Población en la fecha del registro (no se usa) |
| `DENSIDAD` | Densidad en la fecha del registro (no se usa, se recalcula) |
| `CAPITALIDAD` | Nombre del núcleo de capitalidad |

**Notas importantes:**
- La superficie municipal cambia solo en casos de fusión o segregación,
  por lo que los datos de 2020 son válidos para el 99,99% de los municipios
  actuales. Solo 1 municipio de los 8.132 carece de superficie por ser una
  fusión posterior a 2020.
- La densidad del CSV **no se usa**: se recalcula con `pob2025 / sup_km2`
  para usar la población más actualizada.
- El código `NUMERO_INSCRIPCION` se transforma a código INE 5 dígitos
  según el patrón: `num[1:3]` (provincia) + `num[3:6]` (municipio).

**Rango de superficies:** mínima 0,03 km² · máxima 1.750,23 km²

---

### 3. `data/Nacional_2025.zip` — Grupos de edad por municipio

| Campo | Valor |
|---|---|
| **Fuente** | INE — Nomenclátor: Población de las Unidades Poblacionales |
| **Fecha de referencia** | 1 de enero de 2025 |
| **Fecha de publicación** | 28 de enero de 2026 |
| **Fichero activo dentro del ZIP** | `nomdef2025.xlsx`, hoja `Edad` |
| **Cobertura** | 8.132 municipios · toda España |
| **Descarga** | INEbase › Padrón › Nomenclátor › Fichero nacional ZIP |
| **URL** | https://www.ine.es/dyngs/INEbase/operacion.htm?c=Estadistica_C&cid=1254736177010&idp=1254735572981 |
| **Licencia** | CC BY 4.0 · Fuente: INE, www.ine.es |

**Ficheros dentro del ZIP:**

| Fichero | Contenido |
|---|---|
| `nomdef2025.xlsx` | Excel con 3 hojas: Sexo, Nacionalidad, **Edad** |
| `Nomdef2025_edad.txt` | Datos de edad en formato de ancho fijo (incluye entidades subemunicipales) |
| `Nomdef2025_sex.txt` | Datos de sexo en formato de ancho fijo |
| `Nomdef2025_naci.txt` | Datos de nacionalidad en formato de ancho fijo |

**Hoja `Edad` — columnas utilizadas:**

| Columna | Descripción |
|---|---|
| `Provincia` | Código de provincia (2 dígitos) |
| `Municipio` | Código de municipio (3 dígitos) |
| `Unidad Poblacional` | Código de entidad · `000000` = total municipal |
| `Total 2025` | Población total del municipio |
| **`De 0 a 15 años`** | **Población joven (0–15 años)** |
| **`De 16 a 64 años`** | **Población en edad laboral (16–64 años)** |
| **`65 y más años`** | **Población mayor dependiente (65+ años)** |

**Nota:** se filtran solo las filas con código de unidad poblacional `000000`,
que corresponden al total del municipio. Las demás filas corresponden a
núcleos, diseminados y entidades subemunicipales.

---

## Fichero generado: `public/municipios_ine.json`

Resultado del cruce de las tres fuentes anteriores. Generado por
`scripts/build_json.py`. Es el único fichero que carga la app en tiempo
de ejecución.

**Estructura de cada registro:**

```json
{
  "cod":        "28079",
  "nombre":     "Madrid",
  "cpro":       "28",
  "provincia":  "Madrid",
  "ccaa":       "Comunidad de Madrid",
  "pob2025":    3477497,
  "sup_km2":    605.77,
  "densidad":   5737.09,
  "pob_0_15":   444875,
  "pob_16_64":  2330668,
  "pob_65_mas": 701954,
  "pct_16_64":  67.0,
  "pct_65_mas": 20.2,
  "anio_pob":   "2025",
  "anio_edad":  "2025",
  "anio_sup":   "2020"
}
```

**Tamaño:** ~2,2 MB · 8.132 registros

---

## Datos que se pueden extraer

### Clasificación territorial

| Variable | Descripción | Fuente temporal |
|---|---|---|
| `densidad` | Densidad de población (hab/km²) calculada con pob. 2025 | 2025/2020 |
| `es_zona_rural` | `true` si pob < 30.000 Y densidad < 100 hab/km² | 2025/2020 |
| `pob2025` | Población oficial total | **2025** |
| `sup_km2` | Superficie en km² | 2020 |

### Demografía y estructura de edad

| Variable | Descripción | Fuente temporal |
|---|---|---|
| `pob_0_15` | Población de 0 a 15 años | **2025** |
| `pob_16_64` | Población en edad laboral (16–64 años) | **2025** |
| `pob_65_mas` | Población de 65 y más años | **2025** |
| `pct_16_64` | Porcentaje de población en edad laboral | **2025** |
| `pct_65_mas` | Porcentaje de población mayor dependiente | **2025** |

### Identificación geográfica

| Variable | Descripción |
|---|---|
| `cod` | Código INE del municipio (5 dígitos: 2 provincia + 3 municipio) |
| `cpro` | Código de provincia (2 dígitos) |
| `nombre` | Denominación oficial del municipio |
| `provincia` | Nombre de la provincia |
| `ccaa` | Comunidad Autónoma |

### Trazabilidad de los datos

Cada registro incluye los campos `anio_pob`, `anio_edad` y `anio_sup`
para saber exactamente la fecha de referencia de cada dato.

---

## Resultados del cruce (datos a 1 enero 2025)

### Resumen nacional

| Indicador | Valor |
|---|---|
| Municipios totales | 8.132 |
| Con superficie km² | 8.131 (99,99%) |
| **Zona rural (Ley 45/2007)** | **6.634 municipios (81,6%)** |
| No rurales | 1.497 municipios (18,4%) |
| Sin superficie (no clasificables) | 1 municipio |
| **Población en zona rural** | **7.438.428 hab. (15,1% de España)** |
| Población 16–64 en zona rural | 4.663.765 hab. (62,7% de la pob. rural) |
| Población 65+ en zona rural | 1.861.524 hab. (25,0% de la pob. rural) |
| Densidad media zona rural | 18,0 hab/km² |
| Municipio rural más pequeño | 6 habitantes |
| Municipio rural más grande | 27.788 habitantes |

### Zonas rurales por Comunidad Autónoma

| CCAA | Munis totales | Rurales | % rural | Pob. rural | 16–64 (rural) | 65+ (rural) |
|---|---:|---:|---:|---:|---:|---:|
| Castilla y León | 2.248 | **2.179** | 96,9% | 840.891 | 497.902 | 264.914 |
| Castilla-La Mancha | 919 | 852 | 92,7% | 903.455 | 573.711 | 216.529 |
| Aragón | 731 | 708 | 96,9% | 429.716 | 270.012 | 105.144 |
| Andalucía | 785 | 588 | 74,9% | 1.889.412 | 1.227.589 | 403.197 |
| Cataluña | 947 | 605 | 63,9% | 545.905 | 346.113 | 125.390 |
| Extremadura | 388 | 371 | 95,6% | 508.638 | 316.517 | 133.561 |
| Galicia | 313 | 228 | 72,8% | 680.161 | 383.584 | 232.522 |
| Comunitat Valenciana | 542 | 283 | 52,2% | 344.834 | 216.874 | 86.255 |
| Navarra | 272 | 237 | 87,1% | 176.315 | 109.272 | 42.026 |
| La Rioja | 174 | 159 | 91,4% | 67.432 | 41.666 | 17.731 |
| País Vasco | 252 | 131 | 52,0% | 118.755 | 75.677 | 26.379 |
| Asturias | 78 | 62 | 79,5% | 209.165 | 123.583 | 66.212 |
| Cantabria | 102 | 68 | 66,7% | 84.787 | 52.164 | 23.125 |
| Comunidad de Madrid | 179 | 85 | 47,5% | 149.986 | 99.417 | 28.380 |
| Canarias | 88 | 31 | 35,2% | 195.335 | 135.042 | 35.640 |
| Illes Balears | 67 | 30 | 44,8% | 114.332 | 76.266 | 21.443 |
| Región de Murcia | 45 | 17 | 37,8% | 179.309 | 118.376 | 33.076 |
| Ceuta | 1 | 0 | — | — | — | — |
| Melilla | 1 | 0 | — | — | — | — |

---

## Arrancar la app

```bash
npm install
npm run dev   # → http://localhost:5173
```

Sin proxy, sin conexión a internet. Funciona en red local o en modo avión.

## Actualizar datos cada año

```bash
# 1. Descarga los nuevos ficheros:
#    Población → https://www.ine.es/pob_xls/pobmun.zip  (cada diciembre)
#    Nomenclátor → INEbase > Nomenclátor > Fichero nacional ZIP  (cada enero-febrero)
#    Superficie → solo si ese año hubo fusiones de municipios

# 2. Coloca los ficheros en data/

# 3. Regenera el JSON:
pip install openpyxl
python scripts/build_json.py

# 4. Vuelve a compilar para producción:
npm run build
```

**Calendario de publicación del INE:**

| Fuente | Mes de publicación | Referencia |
|---|---|---|
| Pobmun (población) | Diciembre | 1 enero del mismo año |
| Nomenclátor nacional (edad) | Enero–febrero | 1 enero del año anterior |
| REL / superficie | Sin periodicidad fija | Solo cambia en fusiones |

---

## Estructura del proyecto

```
data/
  pobmun.zip                    ← Población INE 2025 (actualizar cada dic.)
  Nacional_2025.zip             ← Nomenclátor INE 2025 con grupos de edad
  esp_municipios_20200518.csv   ← Superficie REL (actualizar solo en fusiones)

public/
  municipios_ine.json           ← Generado por build_json.py · NO editar a mano

scripts/
  build_json.py                 ← Cruce de fuentes y generación del JSON

src/
  App.svelte                    ← Interfaz: filtros, tabla, exportación
  lib/
    ine.js                      ← Lógica: carga, clasificación Ley 45/2007, CSV/JSON

package.json
vite.config.js
README.md
```

---

## Exportación

La app genera en cualquier momento, con los filtros activos:

- **CSV** — separador `;`, UTF-8 BOM, compatible con Excel directamente
- **JSON** — incluye bloque `metadatos` con fuentes, fechas y criterio legal

Ambos formatos incluyen los campos `anio_pob`, `anio_edad` y `anio_sup`
para que el fichero exportado sea autoexplicativo sobre la antigüedad de
cada dato.

---

## Cita recomendada

```
Instituto Nacional de Estadística (INE). Cifras Oficiales de Población:
Revisión del Padrón Municipal a 1 de enero de 2025. Publicado 11/12/2025.
www.ine.es · Licencia CC BY 4.0

Instituto Nacional de Estadística (INE). Nomenclátor: Población por
Unidades Poblacionales a 1 de enero de 2025. Publicado 28/01/2026.
www.ine.es · Licencia CC BY 4.0

Ministerio de Política Territorial. Registro de Entidades Locales (REL).
Superficie territorial de los municipios de España. Mayo 2020.
www.mptfp.gob.es
```
