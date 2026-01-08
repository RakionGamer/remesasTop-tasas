const NORMALIZACION_PAISES = {
  chile: "Chile",
  perú: "Peru",
  peru: "Peru",
  argentina: "Argentina",
  colombia: "Colombia",
  brasil: "Brasil",
  brazil: "Brasil",
  méxico: "Mexico",
  mexico: "Mexico",
  panama: "Panama",
  panamá: "Panama",
  ecuador: "Ecuador",
  españa: "España",
  espana: "España",
  spain: "España",
  "estados unidos": "USA",
  usa: "USA",
  eeuu: "USA",
  "ee.uu.": "USA",
  "united states": "USA",
  venezuela: "Venezuela",
};

function normalizarPais(nombrePais) {
  if (!nombrePais) return null;

  const nombreNormalizado = nombrePais
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const [clave, valor] of Object.entries(NORMALIZACION_PAISES)) {
    const claveNormalizada = clave
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (nombreNormalizado === claveNormalizada) {
      return valor;
    }
  }
  return nombrePais.charAt(0).toUpperCase() + nombrePais.slice(1);
}
function normalizarTasas(tasasObj) {
  const tasasNormalizadas = {};
  for (const [pais, tasa] of Object.entries(tasasObj)) {
    const paisNormalizado = normalizarPais(pais);
    tasasNormalizadas[paisNormalizado] = tasa;
  }
  return tasasNormalizadas;
}

function aplicarConfiguracion(tasasNormalizadas, configuracion) {
  const resultado = {
    tasaChile: null,
    tasaPeru: null,
    tasaColombia: null,
    tasaEspaña: null,
    tasaArgentina: null,
    tasaUSA: null,
    tasaMexico: null,
    tasaBrasil: null,
    tasaPanama: null,
    tasaEcuador: null,
    tasaVenezuela: null,
    tasaChilePeru: null,
    tasaChileArgentina: null,
    tasaChileMexico: null,
    tasaChileBrasil: null,
    tasaChilePanama: null,
    tasaChileColombia: null,
    tasaChileEspaña: null,
    tasaChileEcuador: null,
    tasaChileUSA: null,
    tasaChileChile: null,
    tasaMexicoPeru: null,
    tasaMexicoArgentina: null,
    tasaMexicoChile: null,
    tasaMexicoBrasil: null,
    tasaMexicoPanama: null,
    tasaMexicoColombia: null,
    tasaMexicoEspaña: null,
    tasaMexicoEcuador: null,
    tasaMexicoUSA: null,
    tasaVenezuelaChile: null,
    tasaVenezuelaPeru: null,
    tasaVenezuelaArgentina: null,
    tasaVenezuelaBrasil: null,
    tasaVenezuelaColombia: null,
    tasaVenezuelaEspaña: null,
    tasaVenezuelaEcuador: null,
    tasaVenezuelaMexico: null,
    speed: null,
    tasasP: null,
  };

  const mapeoTasas = {
    tasaChile: "Chile",
    tasaPeru: "Peru",
    tasaColombia: "Colombia",
    tasaEspaña: "España",
    tasaArgentina: "Argentina",
    tasaUSA: "USA",
    tasaMexico: "Mexico",
    tasaBrasil: "Brasil",
    tasaPanama: "Panama",
    tasaEcuador: "Ecuador",
    tasaVenezuela: "Venezuela",

    tasaChilePeru: "Peru",
    tasaChileArgentina: "Argentina",
    tasaChileMexico: "Mexico",
    tasaChileBrasil: "Brasil",
    tasaChilePanama: "Panama",
    tasaChileColombia: "Colombia",
    tasaChileEspaña: "España",
    tasaChileEcuador: "Ecuador",
    tasaChileUSA: "USA",
    tasaChileChile: "Chile",

    tasaMexicoPeru: "Peru",
    tasaMexicoArgentina: "Argentina",
    tasaMexicoChile: "Chile",
    tasaMexicoBrasil: "Brasil",
    tasaMexicoPanama: "Panama",
    tasaMexicoColombia: "Colombia",
    tasaMexicoEspaña: "España",
    tasaMexicoEcuador: "Ecuador",
    tasaMexicoUSA: "USA",

    tasaVenezuelaChile: "Chile",
    tasaVenezuelaPeru: "Peru",
    tasaVenezuelaArgentina: "Argentina",
    tasaVenezuelaBrasil: "Brasil",
    tasaVenezuelaColombia: "Colombia",
    tasaVenezuelaEspaña: "España",
    tasaVenezuelaEcuador: "Ecuador",
    tasaVenezuelaMexico: "Mexico",
  };

  Object.keys(configuracion).forEach((clave) => {
    const paisDestino = mapeoTasas[clave];
    if (paisDestino && tasasNormalizadas[paisDestino]) {
      resultado[clave] = tasasNormalizadas[paisDestino];
    }
  });

  return resultado;
}

export async function validarTasasPorCantidad(jsonData) {
  const otrosTextos = jsonData.otros_textos || [];
  const textoCompleto = otrosTextos.join(" ");
  const esCambios = /Cambio/i.test(textoCompleto);
  const esEnvioChile = /ENV[IÍ]O DESDE CHILE/i.test(textoCompleto);
  const esEnvioMexico = /ENV[IÍ]O DESDE M[EÉ]XICO/i.test(textoCompleto);
  const esEnvioVenezuela = /Env[ií]os? desde Venezuela/i.test(textoCompleto);
  const tasasNormalizadas = normalizarTasas(jsonData.tasas || {});

  const configuraciones = {
    1: {
      tasaChile: true,
      tasaPeru: true,
      tasaColombia: true,
      tasaBrasil: true,
      tasaArgentina: true,
      tasaPanama: true,
      tasaUSA: true,
      tasaMexico: true,
      tasaEspaña: true,
      tasaEcuador: true,
    },
    2: {
      tasaChile: true,
      tasaPeru: true,
      tasaColombia: true,
      tasaArgentina: true,
      tasaMexico: true,
    },
    3: {
      tasaChilePeru: true,
      tasaChileArgentina: true,
      tasaChileMexico: true,
      tasaChileBrasil: true,
      tasaChilePanama: true,
      tasaChileColombia: true,
      tasaChileEspaña: true,
      tasaChileEcuador: true,
      tasaChileUSA: true,
    },
    4: {
      tasaMexicoPeru: true,
      tasaMexicoArgentina: true,
      tasaMexicoChile: true,
      tasaMexicoBrasil: true,
      tasaMexicoColombia: true,
      tasaMexicoEspaña: true,
      tasaMexicoEcuador: true,
    },
    5: {
      tasaVenezuelaChile: true,
      tasaVenezuelaPeru: true,
      tasaVenezuelaArgentina: true,
      tasaVenezuelaColombia: true,
      tasaVenezuelaMexico: true,
      tasaVenezuelaEcuador: true,
    },
  };

  let configAUsar;
  if (esCambios) configAUsar = configuraciones[2];
  else if (esEnvioChile) configAUsar = configuraciones[3];
  else if (esEnvioMexico) configAUsar = configuraciones[4];
  else if (esEnvioVenezuela) configAUsar = configuraciones[5];
  else configAUsar = configuraciones[1];
  const resultado = aplicarConfiguracion(tasasNormalizadas, configAUsar);
  return {
    ...resultado,
    otros_textos: otrosTextos,
  };
}
