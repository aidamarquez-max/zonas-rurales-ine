# Diccionario de columnas — Zonas Rurales España

Descripción detallada de todos los campos del fichero `municipios_ine.json`
y del CSV exportado `municipios_espana_completo_abr26.csv`.

---

## Identificación geográfica

| Campo | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `cod` | texto | `01003` | Código INE del municipio. **5 dígitos**: los 2 primeros son el código de provincia, los 3 últimos el código de municipio dentro de esa provincia. Es el identificador oficial y estable del municipio. |
| `nombre` | texto | `Aramaio` | Denominación oficial del municipio según el INE (Padrón Municipal 2025). |
| `cpro` | texto | `01` | Código de provincia (2 dígitos). Corresponde a los 2 primeros dígitos de `cod`. |
| `provincia` | texto | `Araba/Álava` | Nombre oficial de la provincia. |
| `ccaa` | texto | `País Vasco` | Comunidad Autónoma. Derivado del código de provincia mediante tabla de correspondencias oficial del INE. |

---

## Población y territorio

| Campo | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `pob2025` | entero | `1354` | **Población total** a 1 de enero de 2025. Fuente: INE, Cifras Oficiales de Población — Revisión del Padrón Municipal (pobmun25.xlsx). Publicado 11/12/2025. |
| `sup_km2` | decimal | `73.26` | **Superficie** del término municipal en km². Fuente: Ministerio de Política Territorial, Registro de Entidades Locales (REL), mayo 2020. La superficie cambia solo en casos de fusión o segregación de municipios, por lo que el dato de 2020 es válido para el 99,99% de los municipios actuales. |
| `densidad` | decimal | `18.48` | **Densidad de población** en habitantes por km². **Fórmula:** `pob2025 / sup_km2`. Calculada con la población de 2025 y la superficie de 2020, para maximizar la actualidad. `null` si no hay superficie disponible. |

---

## Clasificación Ley 45/2007

| Campo | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `es_zona_rural` | booleano / texto | `true` / `SI` | Indica si el municipio cumple **ambos** criterios de la Ley 45/2007, art. 3. **Fórmula:** `pob2025 < 30.000 Y densidad < 100`. En CSV aparece como `SI` / `NO`. `NO` también si no hay superficie (no clasificable). **Nota metodológica:** la Ley prevé que la zona rural es la *agregación* de municipios candidatos y que la delimitación formal corresponde a cada Comunidad Autónoma. Este campo identifica los municipios candidatos individualmente, no sustituye al acto administrativo autonómico. |

---

## Estructura de edad

Fuente: INE, Nomenclátor Nacional 2025, hoja `Edad` (nomdef2025.xlsx). Referencia: 1 de enero de 2025. Publicado 28/01/2026.

| Campo | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `pob_0_15` | entero | `183` | Población de **0 a 15 años** (menores de 16). |
| `pob_16_64` | entero | `826` | Población de **16 a 64 años** — franja convencional de edad laboral. Es el denominador utilizado para calcular la tasa de paro estimada. |
| `pob_65_mas` | entero | `344` | Población de **65 y más años** — franja de dependencia por envejecimiento. |
| `pct_16_64` | decimal | `61.0` | **Porcentaje de población en edad laboral** sobre la población total del municipio. **Fórmula:** `pob_16_64 / pob2025 × 100`. Indica el peso de la población potencialmente activa. Un valor bajo puede señalar municipios muy envejecidos o con alta proporción de menores. |
| `pct_65_mas` | decimal | `25.4` | **Porcentaje de población mayor** (65+) sobre la población total del municipio. **Fórmula:** `pob_65_mas / pob2025 × 100`. A mayor porcentaje, mayor envejecimiento relativo. La media nacional ronda el 20%. En zonas rurales la media es de **25,0%**, significativamente por encima. |

> **Nota:** `pct_16_64 + pct_65_mas + (pob_0_15/pob2025×100) ≈ 100%`. Los tres grupos suman la población total.

---

## Paro registrado (SEPE, abril 2026)

Fuente: SEPE — Estadísticas de Paro Registrado por Municipios. Fichero `PARO_MUNICIPIOS_ABRIL26.xlsx`. Referencia: datos del mes de **abril de 2026**.

**Qué es el paro registrado:** número de personas demandantes de empleo inscritas en las oficinas del SEPE a fin de mes, excluidas las que están ocupadas, en formación, o con otras circunstancias. **No es la tasa de paro de la EPA** (Encuesta de Población Activa), que mide el desempleo mediante encuesta a hogares con metodología diferente.

**Valores censurados (`<5`):** el SEPE oculta los valores entre 1 y 4 personas para proteger la privacidad en municipios pequeños, publicándolos como `<5`. En el fichero se almacenan como `2` (punto medio orientativo). Afecta especialmente a municipios rurales pequeños.

| Campo | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `paro_total` | entero | `2` | **Total de parados registrados** en el municipio en abril 2026. Incluye todos los sexos y edades. |
| `paro_h_m25` | entero | `0` | Parados **hombres menores de 25 años**. |
| `paro_h_25_44` | entero | `0` | Parados **hombres de 25 a 44 años**. |
| `paro_h_m45` | entero | `2` | Parados **hombres de 45 años o más**. |
| `paro_m_m25` | entero | `0` | Paradas **mujeres menores de 25 años**. |
| `paro_m_25_44` | entero | `0` | Paradas **mujeres de 25 a 44 años**. |
| `paro_m_m45` | entero | `0` | Paradas **mujeres de 45 años o más**. |
| `paro_agri` | entero | `null` | Parados en el sector **agricultura, ganadería, silvicultura y pesca** (CNAE secciones A). `null` si el SEPE no desglosa ese sector para ese municipio. |
| `paro_indus` | entero | `0` | Parados en el sector **industria manufacturera y extractiva** (CNAE secciones B–E). |
| `paro_constr` | entero | `0` | Parados en el sector **construcción** (CNAE sección F). |
| `paro_serv` | entero | `2` | Parados en el sector **servicios** (CNAE secciones G–U). Incluye comercio, hostelería, transporte, administración pública, educación, sanidad, etc. |
| `paro_sin_emp` | entero | `null` | Parados **sin empleo anterior** (personas que buscan su primer empleo o llevan más de un año sin trabajar y no han podido ser clasificadas sectorialmente). |
| `tasa_paro_est` | decimal | `0.2` | **Tasa de paro estimada** del municipio. **Fórmula:** `paro_total / pob_16_64 × 100`. Expresada en porcentaje. **Limitaciones importantes:** (1) el paro registrado subestima el desempleo real porque excluye a quienes no están inscritos en el SEPE; (2) el denominador (`pob_16_64`) incluye a toda la población en edad laboral, no solo a los activos, por lo que la tasa resultante es sistemáticamente inferior a la tasa de paro EPA; (3) las fechas de referencia no coinciden exactamente (población a 1 enero 2025, paro a abril 2026). Debe interpretarse como **indicador comparativo relativo** entre municipios, no como tasa de paro oficial. |

> **Comprobación de coherencia:** `paro_h_m25 + paro_h_25_44 + paro_h_m45 + paro_m_m25 + paro_m_25_44 + paro_m_m45 ≈ paro_total` (puede haber pequeñas diferencias por redondeo en valores censurados).

---

## Contratos registrados (SEPE, abril 2026)

Fuente: SEPE — Estadísticas de Contratos Registrados por Municipios. Fichero `PARO_MUNICIPIOS_ABRIL26.xlsx`, hojas `CONTRATOS`. Referencia: contratos comunicados al SEPE **durante el mes de abril de 2026** (no es un stock, es un flujo mensual).

**Qué son los contratos registrados:** contratos de trabajo comunicados por las empresas al SEPE en el mes. Un mismo trabajador puede tener varios contratos en el mes. No representan el número de personas contratadas, sino el número de contrataciones realizadas.

| Campo | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `contr_total` | entero | `16` | **Total de contratos registrados** en el municipio en abril 2026. |
| `contr_h_indef` | entero | `2` | Contratos de **inicio indefinido firmados por hombres** en el mes. Incluye contratos indefinidos ordinarios, a tiempo parcial indefinidos, fijos discontinuos, etc. |
| `contr_h_temp` | entero | `8` | Contratos de **inicio temporal firmados por hombres** en el mes. Incluye contratos temporales por obra, eventuales, de interinidad, formativos, etc. |
| `contr_m_indef` | entero | `2` | Contratos de **inicio indefinido firmados por mujeres** en el mes. |
| `contr_m_temp` | entero | `2` | Contratos de **inicio temporal firmados por mujeres** en el mes. |
| `contr_agri` | entero | `2` | Contratos en el sector **agricultura**. |
| `contr_indus` | entero | `9` | Contratos en el sector **industria**. |
| `contr_constr` | entero | `null` | Contratos en el sector **construcción**. |
| `contr_serv` | entero | `6` | Contratos en el sector **servicios**. |

> **Nota:** el Excel del SEPE también incluye conversiones de contratos temporales a indefinidos (`conv_indef`), que se procesan internamente pero no se exponen en la tabla principal por ser un campo menos relevante para el análisis de zonas rurales.

---

## Trazabilidad temporal

| Campo | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `anio_pob` | texto | `2025` | Año de referencia de `pob2025`: datos a **1 de enero de 2025**. |
| `anio_edad` | texto | `2025` | Año de referencia de los grupos de edad (`pob_0_15`, `pob_16_64`, `pob_65_mas`): datos a **1 de enero de 2025** (Nomenclátor INE). |
| `anio_sup` | texto | `2020` | Año de referencia de `sup_km2`: datos del **Registro de Entidades Locales de mayo de 2020**. |
| `anio_paro` | texto | `Abril 2026` | Mes y año de referencia de los datos de paro y contratos del SEPE. |

---

## Resumen de fórmulas calculadas

| Campo | Fórmula | Denominador |
|---|---|---|
| `densidad` | `pob2025 ÷ sup_km2` | Superficie del municipio en km² |
| `pct_16_64` | `pob_16_64 ÷ pob2025 × 100` | Población **total** del municipio |
| `pct_65_mas` | `pob_65_mas ÷ pob2025 × 100` | Población **total** del municipio |
| `tasa_paro_est` | `paro_total ÷ pob_16_64 × 100` | Población de **16 a 64 años** (no la población activa) |
| `es_zona_rural` | `pob2025 < 30.000 AND densidad < 100` | Criterio Ley 45/2007, art. 3 |

---

## Valores nulos y censurados

| Valor | Significado |
|---|---|
| `null` | Dato no disponible para ese municipio en esa variable. En CSV aparece como celda vacía. |
| `2` en campos de paro/contratos | Valor censurado por el SEPE (`<5`): significa que hay entre 1 y 4 personas. Se almacena como 2 (punto medio orientativo) para permitir sumas y comparaciones. |
| `0` | Cero real: ninguna persona en esa categoría. |

---

## Columnas en las tablas de la app

### Tabla "Municipios"

| Columna en pantalla | Campo en datos | Fórmula / Nota |
|---|---|---|
| Municipio | `nombre` + `cod` | |
| Provincia | `provincia` | |
| Pob. 2025 | `pob2025` | |
| Dens. | `densidad` | `pob2025 / sup_km2` |
| Rural | `es_zona_rural` | `pob2025 < 30.000 AND densidad < 100` |
| 16–64 | `pob_16_64` | Nº de personas entre 16 y 64 años |
| 65+ | `pob_65_mas` | Nº de personas de 65 años o más |
| Paro abr.26 | `paro_total` | Parados registrados SEPE, abril 2026 |
| Tasa est. | `tasa_paro_est` | `paro_total / pob_16_64 × 100` — **NO** es la tasa EPA |
| Contratos | `contr_total` | Contratos firmados en abril 2026 (flujo mensual) |

### Tabla "Empleo por CCAA" — columnas de porcentaje

| Columna | Fórmula | Sobre qué se calcula |
|---|---|---|
| % rural | `n_rurales / n_totales × 100` | Municipios de la CCAA |
| % lab. | `pob_16_64_rural / pob_rural × 100` | Población **rural** de la CCAA |
| % dep. | `pob_65_mas_rural / pob_rural × 100` | Población **rural** de la CCAA |
| Tasa paro est. | `paro_rural / pob_16_64_rural × 100` | Pob. 16-64 de los municipios **rurales** de la CCAA |
