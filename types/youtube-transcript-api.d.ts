declare module 'youtube-transcript-api' {
  export class YouTubeTranscriptApi {
    static getTranscript(videoId: string): Promise<Array<{ text: string; start: number; duration: number }>>
    static listLanguages(videoId: string): Promise<Array<{ language: string; languageCode: string }>>
  }
}
