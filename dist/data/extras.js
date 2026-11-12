// Nominal GDP per capita, 2024. Mainland values are in CNY as published.
// Hong Kong, Macao and Taiwan values are the official reports' USD equivalents.
(() => {
  const cnyPerUsd = 7.1217;
  const mainlandGdp = {
    anhui: 82694,
    beijing: 228167,
    chongqing: 100903,
    fujian: 137920,
    gansu: 52825,
    guangdong: 111146,
    guangxi: 57071,
    guizhou: 58685,
    hainan: 75903,
    hebei: 64352,
    heilongjiang: 54102,
    henan: 64888,
    hubei: 102832,
    hunan: 81225,
    "inner-mongolia": 110011,
    jiangsu: 160694,
    jiangxi: 75862,
    jilin: 61689,
    liaoning: 78236,
    ningxia: 75484,
    qinghai: 66568,
    shaanxi: 89915,
    shandong: 97575,
    shanghai: 217140,
    shanxi: 73769,
    sichuan: 77333,
    tianjin: 132143,
    tibet: 75237,
    xinjiang: 78660,
    yunnan: 67612,
    zhejiang: 135565
  };
  const reportedUsd = {
    "hong-kong": 54100,
    macau: 73154,
    taiwan: 34040
  };
  const gdpPerCapita = {
    ...mainlandGdp,
    ...Object.fromEntries(Object.entries(reportedUsd).map(([id, usd]) => [id, Math.round(usd * cnyPerUsd)]))
  };
  const gdpPerCapitaUsd = {
    ...Object.fromEntries(Object.entries(mainlandGdp).map(([id, cny]) => [id, Math.round(cny / cnyPerUsd)])),
    ...reportedUsd
  };

  globalThis.CHINA_EXTRAS = {
    gdpYear: 2024,
    gdpPerCapita,
    gdpPerCapitaUsd,
    gdpExchangeRate: cnyPerUsd,
    gdpSources: [
      { label: "Jiangsu Statistical Yearbook · provincial GDP per capita", url: "https://tj.jiangsu.gov.cn/2025/nj21/nj2101.htm" },
      { label: "National Bureau of Statistics · annual average CNY/USD rate", url: "https://www.stats.gov.cn/sj/zxfb/202502/t20250228_1958817.html" },
      { label: "Hong Kong Budget · 2024 economic performance", url: "https://www.budget.gov.hk/2025/eng/pdf/e_budget_speech_2025-26.pdf" },
      { label: "Macao Statistics and Census Service · 2024 GDP", url: "https://www.dsec.gov.mo/getAttachment/61c454e1-9fd1-4593-ac4c-9109d8fb4373/E_PIB_PUB_2024_Y.aspx" },
      { label: "Taiwan at a Glance · 2024 GDP snapshot", url: "https://ws.mofa.gov.tw/001/Upload/402/relfile/20/422/779bb0cb-5fcb-47eb-8e82-84ac0c39d61b.pdf" }
    ],
    symbolSources: [
      { label: "1997 circular on local flags and emblems", url: "https://cpc.people.com.cn/BIG5/64162/71380/71382/71384/4857802.html" },
      { label: "Hong Kong Protocol Division · regional flag and emblem", url: "https://www.protocol.gov.hk/en/flags-emblems-anthem.html" },
      { label: "Macao Official Gazette · regional flag and emblem", url: "https://bo.dsaj.gov.mo/bo/i/1999/01/aviso05.asp" }
    ]
  };
})();
