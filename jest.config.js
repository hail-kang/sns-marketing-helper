// jest.config.js
module.exports = {
  preset: "ts-jest", // ts-jest 사용 설정
  testEnvironment: "jsdom", // 테스트 환경 설정 (브라우저 환경인 경우 'jsdom')
  testMatch: ["**/test.ts"], // 테스트 파일 패턴 지정
}
