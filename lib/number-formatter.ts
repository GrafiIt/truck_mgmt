/**
 * 숫자에 천단위 콤마를 추가하는 유틸리티 함수
 * @param value - 포맷팅할 숫자 또는 문자열
 * @returns 천단위 콤마가 추가된 문자열
 */
export function formatNumberWithCommas(value: string | number): string {
  if (!value && value !== 0) return ""
  
  // 문자열을 숫자만 남기고 정리
  const numStr = String(value).replace(/[^\d]/g, "")
  if (!numStr) return ""
  
  // 천단위 콤마 추가
  return Number(numStr).toLocaleString("ko-KR")
}

/**
 * 천단위 콤마가 포함된 문자열에서 순수 숫자를 추출
 * @param value - 콤마가 포함된 문자열
 * @returns 순수 숫자 문자열
 */
export function parseNumberFromFormatted(value: string): string {
  return value.replace(/[^\d]/g, "")
}

/**
 * Input onChange 핸들러에서 사용하기 위한 유틸리티
 * @param e - React.ChangeEvent<HTMLInputElement>
 * @param setter - setState 함수
 */
export function handleNumberInputChange(
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (value: string) => void
) {
  const rawValue = e.target.value.replace(/[^\d]/g, "")
  setter(rawValue)
}
