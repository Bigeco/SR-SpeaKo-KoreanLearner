from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="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",
)

user_input = "박끼"
correct_input = "발끼"
prompt_text = f"""
    Given the correct pronunciation text and the mispronounced sentence text, provide the result using English romanization. Only return the answer in the format "(mispronunciation)->(correct pronunciation)".
    (Example)
    Mispronounced text: 곤뇽
    Correct pronunciation text: 공뇽
    Answer: (gon-nyong)->(gong-nyong)
    (Problem)
    Mispronounced text: {user_input}
    Correct pronunciation text: {correct_input}
"""
completion = client.chat.completions.create(
  extra_headers={
    "HTTP-Referer": "https://speako-kor.netlify.app/", # Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "<YOUR_SITE_NAME>", # Optional. Site title for rankings on openrouter.ai.
  },
  extra_body={},
  model="meta-llama/llama-3.3-8b-instruct:free",
  messages=[
    {
      "role": "user",
      "content": prompt_text
    }
  ]
)
print(completion.choices[0].message.content)