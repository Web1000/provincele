(() => {
  const atlas = {
    label: 'Language Atlas of China, 2nd edition',
    url: 'https://www.cp.com.cn/book/8094abe4-a.html',
  };
  const minorityLanguages = {
    label: 'Chinese Ministry of Education overview of languages and scripts',
    url: 'https://www.moe.gov.cn/jyb_xxgk/xxgk/neirong/fenlei/sxml_zwgk/yuyanwenzi/202610/t20261023_1455676.html',
  };
  const tibetanVarieties = {
    label: 'China Tibetology Research Center on Tibetan varieties',
    url: 'https://www.tibetology.ac.cn/2023-02/28/content_42276501.htm',
  };
  const sources = {
    cantonese: {
      label: 'Hong Kong government use of 粵語 for Cantonese',
      url: 'https://www.legco.gov.hk/yr13-14/chinese/fc/fc/w_q/csb-c.pdf',
    },
    korean: {
      label: 'Fujian government overview of minority languages and scripts',
      url: 'https://www.fujian.gov.cn/hdjl/hdjlzsk/mzzjt/mz/202209/t20220913_5991001.htm',
    },
    shanghainese: {
      label: 'Shanghai Municipal Administration of Culture and Tourism on Shanghainese',
      url: 'https://cmp.whlyj.sh.gov.cn/CMP/sho_init.ac?type=4',
    },
    taiwanese: {
      label: 'Taiwan Ministry of Education Taiwanese Hokkien dictionary',
      url: 'https://sutian.moe.edu.tw/und-hani/',
    },
  };
  const labels = {
    'Amdo Tibetan': ['藏语安多方言', tibetanVarieties],
    Bai: ['白语', minorityLanguages],
    'Beijing Mandarin': ['北京官话', atlas],
    Cantonese: ['粵語', sources.cantonese],
    'Central Plains Mandarin': ['中原官话', atlas],
    'Central Tibetan': ['藏语卫藏方言', tibetanVarieties],
    'Gan Chinese': ['赣语', atlas],
    Hlai: ['黎语', minorityLanguages],
    'Huizhou Chinese': ['徽语', atlas],
    'Jiaoliao Mandarin': ['胶辽官话', atlas],
    'Jilu Mandarin': ['冀鲁官话', atlas],
    'Jin Chinese': ['晋语', atlas],
    Korean: ['朝鲜语', sources.korean],
    'Lanyin Mandarin': ['兰银官话', atlas],
    'Miao (Hmongic)': ['苗语', minorityLanguages],
    Mongolian: ['蒙古语', minorityLanguages],
    'Northeastern Mandarin': ['东北官话', atlas],
    Shanghainese: ['上海话', sources.shanghainese],
    'Southern Min': ['闽南语', atlas],
    'Southwestern Mandarin': ['西南官话', atlas],
    'Taiwanese Hokkien': ['臺灣台語', sources.taiwanese],
    'Tianjin Mandarin': ['天津话', atlas],
    Uyghur: ['维吾尔语', minorityLanguages],
    'Wu Chinese': ['吴语', atlas],
    'Xiang Chinese': ['湘语', atlas],
    Zhuang: ['壮语', minorityLanguages],
  };
  globalThis.PROVINCE_LANGUAGES = Object.fromEntries(
    Object.entries(labels).map(([language, [text, source]]) => [
      language,
      { text, prompt: 'Which language or variety has this name in Chinese?', source },
    ]),
  );
})();
