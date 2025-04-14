const imageMapping = {
    'ㄱ': 'giyok.png',
    'ㄴ': 'nieun.png',
    'ㄷ': 'digeut.png',
    'ㄹ': 'rieul.png',
    'ㅁ': 'mieum.png',
    'ㅂ': 'bieup.png',
    'ㅅ': 'siot.png',
    'ㅈ': 'jieut.png',
    'ㅊ': 'chieut.png',
    'ㅋ': 'kieuk.png',
    'ㅌ': 'tieut.png',
    'ㅍ': 'pieup.png',
    'ㅎ': 'hieut.png',
    'ㅏ': 'a.png',
    'ㅓ': 'eo.png',
    'ㅗ': 'o.png',
    'ㅜ': 'u.png',
    'ㅡ': 'eu.png',
    'ㅣ': 'i.png',
    'ㅔ': 'e.png',
    'ㅐ': 'ae.png'
  };
  
  function getImageForJamo(jamo) {
    return imageMapping[jamo] || null;
  }
  
  function getImagePath(jamo) {
    const imageName = getImageForJamo(jamo);
    return imageName ? `/images/${imageName}` : null;
  }
  
  export { getImageForJamo, getImagePath, imageMapping };
  