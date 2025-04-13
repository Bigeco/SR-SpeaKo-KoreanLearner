image_mapping = {
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
}

def get_image_for_jamo(jamo):
    return image_mapping.get(jamo, None)

jamo = 'ㄴ'
image_file = get_image_for_jamo(jamo)
if image_file:
    print(f"{jamo}에 해당하는 이미지 파일: {image_file}")
else:
    print("해당 자모음에 대한 이미지 파일을 찾을 수 없습니다.")
