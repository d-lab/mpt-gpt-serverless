export type gptModel = {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: Array<object>
    finish_reason: string
  }>
  error: {
    message: object
  },
  usage: object
}