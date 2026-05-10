# Master Admin 인증 업데이트

## 변경 내용

`/app/drivermgm/master-admin/actions.ts` 파일의 마스터 관리자 인증 방식이 하드코딩된 자격증명에서 데이터베이스 기반 자격증명으로 변경되었습니다.

### 이전 방식
- **아이디**: `tezmenia` (하드코딩)
- **비밀번호**: `hun0316` (하드코딩)

### 새로운 방식
Supabase의 `hunwoo` 스키마에서 `hun_main_pass_manager` 테이블을 사용하여 자격증명을 관리합니다.

**조건**: `project_num = 1002`
**필드**:
- `login_id`: 로그인 아이디
- `login_ps`: 로그인 비밀번호

## 영향을 받는 함수

### 1. `masterAdminLogin()`
- 입력된 아이디와 비밀번호를 데이터베이스와 비교하여 인증

### 2. `changeMasterPassword()`
- 새 비밀번호를 `hun_main_pass_manager` 테이블의 `login_ps` 컬럼에 저장

### 3. `deleteCompany()`
- 기업 삭제 시 관리자 인증을 데이터베이스에서 확인

## 필수 요구사항

1. **Supabase 환경 변수 설정**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **데이터베이스 테이블**
   - `hunwoo.hun_main_pass_manager` 테이블이 존재해야 함
   - `project_num = 1002` 행에 `login_id`와 `login_ps` 컬럼 값이 설정되어 있어야 함

## 마이그레이션 가이드

기존 하드코딩된 자격증명을 사용하고 있다면, 다음 단계를 따르세요:

```sql
-- 1. hunwoo.hun_main_pass_manager 테이블에 project_num = 1002 행이 있는지 확인
SELECT * FROM hunwoo.hun_main_pass_manager WHERE project_num = 1002;

-- 2. 없다면 새로 추가
INSERT INTO hunwoo.hun_main_pass_manager (project_num, login_id, login_ps)
VALUES (1002, 'tezmenia', 'hun0316');

-- 3. 또는 기존 행 업데이트
UPDATE hunwoo.hun_main_pass_manager 
SET login_id = 'tezmenia', login_ps = 'hun0316'
WHERE project_num = 1002;
```
