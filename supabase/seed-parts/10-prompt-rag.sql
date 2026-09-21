-- LLM Bible v2.1.1 category seed: 10-prompt-rag.sql
-- Safe to re-run: ON CONFLICT DO UPDATE.
begin;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-081','rag-support','RAG grounded','고객지원','중급','고객지원 · RAG grounded 패턴','고객 문의를 유형별로 분류하고 해결책을 안내','제공된 <sources>만 사용하여 고객 문의를 유형별로 분류하고 해결책을 안내하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{customer_message}}
</question_or_input>

출력: 분류, 긴급도, 답변 초안, 추가 확인사항','분류, 긴급도, 답변 초안, 추가 확인사항','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{customer_message}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"고객 문의를 유형별로 분류하고 해결책을 안내 — 입력은 {{customer_message}}만 넣고 결과를 분류, 긴급도, 답변 초안, 추가 확인사항 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"고객 문의를 유형별로 분류하고 해결책을 안내 해줘.","better_example":"목표: 고객 문의를 유형별로 분류하고 해결책을 안내\n입력: {{customer_message}}\n출력: 분류, 긴급도, 답변 초안, 추가 확인사항\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 고객 문의를 유형별로 분류하고 해결책을 안내하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{customer_message}}\n</question_or_input>\n\n출력: 분류, 긴급도, 답변 초안, 추가 확인사항","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-082','rag-research','RAG grounded','리서치','중급','리서치 · RAG grounded 패턴','여러 출처를 비교해 핵심 주장과 근거를 정리','제공된 <sources>만 사용하여 여러 출처를 비교해 핵심 주장과 근거를 정리하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{sources_and_question}}
</question_or_input>

출력: 주장, 근거, 상충점, 미확인 항목','주장, 근거, 상충점, 미확인 항목','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{sources_and_question}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"여러 출처를 비교해 핵심 주장과 근거를 정리 — 입력은 {{sources_and_question}}만 넣고 결과를 주장, 근거, 상충점, 미확인 항목 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"여러 출처를 비교해 핵심 주장과 근거를 정리 해줘.","better_example":"목표: 여러 출처를 비교해 핵심 주장과 근거를 정리\n입력: {{sources_and_question}}\n출력: 주장, 근거, 상충점, 미확인 항목\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 여러 출처를 비교해 핵심 주장과 근거를 정리하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{sources_and_question}}\n</question_or_input>\n\n출력: 주장, 근거, 상충점, 미확인 항목","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-083','rag-summary','RAG grounded','문서','중급','문서 · RAG grounded 패턴','긴 문서를 의사결정용 요약으로 압축','제공된 <sources>만 사용하여 긴 문서를 의사결정용 요약으로 압축하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{document}}
</question_or_input>

출력: 핵심 결론, 근거, 위험, 다음 행동','핵심 결론, 근거, 위험, 다음 행동','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{document}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"긴 문서를 의사결정용 요약으로 압축 — 입력은 {{document}}만 넣고 결과를 핵심 결론, 근거, 위험, 다음 행동 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"긴 문서를 의사결정용 요약으로 압축 해줘.","better_example":"목표: 긴 문서를 의사결정용 요약으로 압축\n입력: {{document}}\n출력: 핵심 결론, 근거, 위험, 다음 행동\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 긴 문서를 의사결정용 요약으로 압축하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{document}}\n</question_or_input>\n\n출력: 핵심 결론, 근거, 위험, 다음 행동","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-084','rag-translation','RAG grounded','번역 QA','중급','번역 QA · RAG grounded 패턴','번역 결과의 의미·용어·톤 일관성을 검토','제공된 <sources>만 사용하여 번역 결과의 의미·용어·톤 일관성을 검토하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{source_text}} + {{translation}}
</question_or_input>

출력: 오류 유형, 수정안, 근거','오류 유형, 수정안, 근거','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{source_text}} + {{translation}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"번역 결과의 의미·용어·톤 일관성을 검토 — 입력은 {{source_text}} + {{translation}}만 넣고 결과를 오류 유형, 수정안, 근거 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"번역 결과의 의미·용어·톤 일관성을 검토 해줘.","better_example":"목표: 번역 결과의 의미·용어·톤 일관성을 검토\n입력: {{source_text}} + {{translation}}\n출력: 오류 유형, 수정안, 근거\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 번역 결과의 의미·용어·톤 일관성을 검토하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{source_text}} + {{translation}}\n</question_or_input>\n\n출력: 오류 유형, 수정안, 근거","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-085','rag-classification','RAG grounded','분류','중급','분류 · RAG grounded 패턴','텍스트를 사전에 정의한 라벨로 안정적으로 분류','제공된 <sources>만 사용하여 텍스트를 사전에 정의한 라벨로 안정적으로 분류하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{items}}
</question_or_input>

출력: label, confidence, reason','label, confidence, reason','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{items}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"텍스트를 사전에 정의한 라벨로 안정적으로 분류 — 입력은 {{items}}만 넣고 결과를 label, confidence, reason 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"텍스트를 사전에 정의한 라벨로 안정적으로 분류 해줘.","better_example":"목표: 텍스트를 사전에 정의한 라벨로 안정적으로 분류\n입력: {{items}}\n출력: label, confidence, reason\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 텍스트를 사전에 정의한 라벨로 안정적으로 분류하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{items}}\n</question_or_input>\n\n출력: label, confidence, reason","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-086','rag-extraction','RAG grounded','정보 추출','중급','정보 추출 · RAG grounded 패턴','문서에서 지정 필드만 구조적으로 추출','제공된 <sources>만 사용하여 문서에서 지정 필드만 구조적으로 추출하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{document}}
</question_or_input>

출력: 지정 JSON 필드와 누락 표시','지정 JSON 필드와 누락 표시','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{document}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"문서에서 지정 필드만 구조적으로 추출 — 입력은 {{document}}만 넣고 결과를 지정 JSON 필드와 누락 표시 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"문서에서 지정 필드만 구조적으로 추출 해줘.","better_example":"목표: 문서에서 지정 필드만 구조적으로 추출\n입력: {{document}}\n출력: 지정 JSON 필드와 누락 표시\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 문서에서 지정 필드만 구조적으로 추출하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{document}}\n</question_or_input>\n\n출력: 지정 JSON 필드와 누락 표시","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-087','rag-report','RAG grounded','보고서','중급','보고서 · RAG grounded 패턴','자료를 경영진 보고서 형식으로 재구성','제공된 <sources>만 사용하여 자료를 경영진 보고서 형식으로 재구성하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{notes_and_data}}
</question_or_input>

출력: 요약, 지표, 리스크, 권고 행동','요약, 지표, 리스크, 권고 행동','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{notes_and_data}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"자료를 경영진 보고서 형식으로 재구성 — 입력은 {{notes_and_data}}만 넣고 결과를 요약, 지표, 리스크, 권고 행동 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"자료를 경영진 보고서 형식으로 재구성 해줘.","better_example":"목표: 자료를 경영진 보고서 형식으로 재구성\n입력: {{notes_and_data}}\n출력: 요약, 지표, 리스크, 권고 행동\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 자료를 경영진 보고서 형식으로 재구성하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{notes_and_data}}\n</question_or_input>\n\n출력: 요약, 지표, 리스크, 권고 행동","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-088','rag-code-review','RAG grounded','코딩','중급','코딩 · RAG grounded 패턴','코드 변경의 버그·보안·테스트 누락을 리뷰','제공된 <sources>만 사용하여 코드 변경의 버그·보안·테스트 누락을 리뷰하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{diff_or_code}}
</question_or_input>

출력: 심각도별 이슈, 근거, 수정 제안','심각도별 이슈, 근거, 수정 제안','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{diff_or_code}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"코드 변경의 버그·보안·테스트 누락을 리뷰 — 입력은 {{diff_or_code}}만 넣고 결과를 심각도별 이슈, 근거, 수정 제안 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"코드 변경의 버그·보안·테스트 누락을 리뷰 해줘.","better_example":"목표: 코드 변경의 버그·보안·테스트 누락을 리뷰\n입력: {{diff_or_code}}\n출력: 심각도별 이슈, 근거, 수정 제안\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 코드 변경의 버그·보안·테스트 누락을 리뷰하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{diff_or_code}}\n</question_or_input>\n\n출력: 심각도별 이슈, 근거, 수정 제안","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-089','rag-debug','RAG grounded','디버깅','중급','디버깅 · RAG grounded 패턴','오류 로그와 코드에서 재현 가능한 원인을 찾고 수정','제공된 <sources>만 사용하여 오류 로그와 코드에서 재현 가능한 원인을 찾고 수정하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{error_log_and_code}}
</question_or_input>

출력: 재현 단계, 원인, 최소 수정, 검증','재현 단계, 원인, 최소 수정, 검증','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{error_log_and_code}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"오류 로그와 코드에서 재현 가능한 원인을 찾고 수정 — 입력은 {{error_log_and_code}}만 넣고 결과를 재현 단계, 원인, 최소 수정, 검증 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"오류 로그와 코드에서 재현 가능한 원인을 찾고 수정 해줘.","better_example":"목표: 오류 로그와 코드에서 재현 가능한 원인을 찾고 수정\n입력: {{error_log_and_code}}\n출력: 재현 단계, 원인, 최소 수정, 검증\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 오류 로그와 코드에서 재현 가능한 원인을 찾고 수정하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{error_log_and_code}}\n</question_or_input>\n\n출력: 재현 단계, 원인, 최소 수정, 검증","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-090','rag-test','RAG grounded','테스트','중급','테스트 · RAG grounded 패턴','요구사항에서 정상·경계·실패 테스트 케이스 생성','제공된 <sources>만 사용하여 요구사항에서 정상·경계·실패 테스트 케이스 생성하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{specification}}
</question_or_input>

출력: 테스트 표, 예상 결과, 우선순위','테스트 표, 예상 결과, 우선순위','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{specification}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"요구사항에서 정상·경계·실패 테스트 케이스 생성 — 입력은 {{specification}}만 넣고 결과를 테스트 표, 예상 결과, 우선순위 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"요구사항에서 정상·경계·실패 테스트 케이스 생성 해줘.","better_example":"목표: 요구사항에서 정상·경계·실패 테스트 케이스 생성\n입력: {{specification}}\n출력: 테스트 표, 예상 결과, 우선순위\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 요구사항에서 정상·경계·실패 테스트 케이스 생성하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{specification}}\n</question_or_input>\n\n출력: 테스트 표, 예상 결과, 우선순위","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-091','rag-sql','RAG grounded','데이터/SQL','중급','데이터/SQL · RAG grounded 패턴','질문을 안전한 읽기 전용 SQL 분석 계획으로 변환','제공된 <sources>만 사용하여 질문을 안전한 읽기 전용 SQL 분석 계획으로 변환하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{schema_and_question}}
</question_or_input>

출력: SQL, 가정, 검증 쿼리, 위험','SQL, 가정, 검증 쿼리, 위험','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{schema_and_question}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"질문을 안전한 읽기 전용 SQL 분석 계획으로 변환 — 입력은 {{schema_and_question}}만 넣고 결과를 SQL, 가정, 검증 쿼리, 위험 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"질문을 안전한 읽기 전용 SQL 분석 계획으로 변환 해줘.","better_example":"목표: 질문을 안전한 읽기 전용 SQL 분석 계획으로 변환\n입력: {{schema_and_question}}\n출력: SQL, 가정, 검증 쿼리, 위험\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 질문을 안전한 읽기 전용 SQL 분석 계획으로 변환하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{schema_and_question}}\n</question_or_input>\n\n출력: SQL, 가정, 검증 쿼리, 위험","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-092','rag-csv','RAG grounded','데이터 분석','중급','데이터 분석 · RAG grounded 패턴','CSV의 품질 문제와 핵심 패턴을 분석','제공된 <sources>만 사용하여 CSV의 품질 문제와 핵심 패턴을 분석하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{csv_profile_or_rows}}
</question_or_input>

출력: 데이터 품질, KPI, 이상치, 후속 분석','데이터 품질, KPI, 이상치, 후속 분석','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{csv_profile_or_rows}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"CSV의 품질 문제와 핵심 패턴을 분석 — 입력은 {{csv_profile_or_rows}}만 넣고 결과를 데이터 품질, KPI, 이상치, 후속 분석 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"CSV의 품질 문제와 핵심 패턴을 분석 해줘.","better_example":"목표: CSV의 품질 문제와 핵심 패턴을 분석\n입력: {{csv_profile_or_rows}}\n출력: 데이터 품질, KPI, 이상치, 후속 분석\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 CSV의 품질 문제와 핵심 패턴을 분석하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{csv_profile_or_rows}}\n</question_or_input>\n\n출력: 데이터 품질, KPI, 이상치, 후속 분석","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-093','rag-meeting','RAG grounded','회의','중급','회의 · RAG grounded 패턴','회의 기록에서 결정사항·담당자·기한을 추출','제공된 <sources>만 사용하여 회의 기록에서 결정사항·담당자·기한을 추출하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{meeting_notes}}
</question_or_input>

출력: 결정, 액션아이템, 담당자, 기한','결정, 액션아이템, 담당자, 기한','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{meeting_notes}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"회의 기록에서 결정사항·담당자·기한을 추출 — 입력은 {{meeting_notes}}만 넣고 결과를 결정, 액션아이템, 담당자, 기한 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"회의 기록에서 결정사항·담당자·기한을 추출 해줘.","better_example":"목표: 회의 기록에서 결정사항·담당자·기한을 추출\n입력: {{meeting_notes}}\n출력: 결정, 액션아이템, 담당자, 기한\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 회의 기록에서 결정사항·담당자·기한을 추출하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{meeting_notes}}\n</question_or_input>\n\n출력: 결정, 액션아이템, 담당자, 기한","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-094','rag-product','RAG grounded','제품기획','중급','제품기획 · RAG grounded 패턴','아이디어를 문제·사용자·가설·검증 계획으로 구조화','제공된 <sources>만 사용하여 아이디어를 문제·사용자·가설·검증 계획으로 구조화하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{product_idea}}
</question_or_input>

출력: 문제정의, 가설, MVP, 실험','문제정의, 가설, MVP, 실험','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{product_idea}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"아이디어를 문제·사용자·가설·검증 계획으로 구조화 — 입력은 {{product_idea}}만 넣고 결과를 문제정의, 가설, MVP, 실험 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"아이디어를 문제·사용자·가설·검증 계획으로 구조화 해줘.","better_example":"목표: 아이디어를 문제·사용자·가설·검증 계획으로 구조화\n입력: {{product_idea}}\n출력: 문제정의, 가설, MVP, 실험\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 아이디어를 문제·사용자·가설·검증 계획으로 구조화하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{product_idea}}\n</question_or_input>\n\n출력: 문제정의, 가설, MVP, 실험","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-095','rag-marketing','RAG grounded','콘텐츠','중급','콘텐츠 · RAG grounded 패턴','브랜드 제약을 지키는 마케팅 카피 초안 작성','제공된 <sources>만 사용하여 브랜드 제약을 지키는 마케팅 카피 초안 작성하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{brief_and_brand_rules}}
</question_or_input>

출력: 카피 후보, 근거, 금지표현 점검','카피 후보, 근거, 금지표현 점검','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{brief_and_brand_rules}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"브랜드 제약을 지키는 마케팅 카피 초안 작성 — 입력은 {{brief_and_brand_rules}}만 넣고 결과를 카피 후보, 근거, 금지표현 점검 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"브랜드 제약을 지키는 마케팅 카피 초안 작성 해줘.","better_example":"목표: 브랜드 제약을 지키는 마케팅 카피 초안 작성\n입력: {{brief_and_brand_rules}}\n출력: 카피 후보, 근거, 금지표현 점검\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 브랜드 제약을 지키는 마케팅 카피 초안 작성하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{brief_and_brand_rules}}\n</question_or_input>\n\n출력: 카피 후보, 근거, 금지표현 점검","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-096','rag-contract','RAG grounded','계약/정책','중급','계약/정책 · RAG grounded 패턴','문서의 위험 조항과 확인 필요사항을 식별','제공된 <sources>만 사용하여 문서의 위험 조항과 확인 필요사항을 식별하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{contract_or_policy}}
</question_or_input>

출력: 조항, 위험, 영향, 확인 질문','조항, 위험, 영향, 확인 질문','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{contract_or_policy}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"문서의 위험 조항과 확인 필요사항을 식별 — 입력은 {{contract_or_policy}}만 넣고 결과를 조항, 위험, 영향, 확인 질문 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"문서의 위험 조항과 확인 필요사항을 식별 해줘.","better_example":"목표: 문서의 위험 조항과 확인 필요사항을 식별\n입력: {{contract_or_policy}}\n출력: 조항, 위험, 영향, 확인 질문\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 문서의 위험 조항과 확인 필요사항을 식별하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{contract_or_policy}}\n</question_or_input>\n\n출력: 조항, 위험, 영향, 확인 질문","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-097','rag-rag-qa','RAG grounded','RAG','중급','RAG · RAG grounded 패턴','검색 문서만 근거로 질문에 답하고 출처 연결','제공된 <sources>만 사용하여 검색 문서만 근거로 질문에 답하고 출처 연결하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{retrieved_chunks}} + {{question}}
</question_or_input>

출력: 답변, source_id, 자료부족 표시','답변, source_id, 자료부족 표시','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{retrieved_chunks}} + {{question}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"검색 문서만 근거로 질문에 답하고 출처 연결 — 입력은 {{retrieved_chunks}} + {{question}}만 넣고 결과를 답변, source_id, 자료부족 표시 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"검색 문서만 근거로 질문에 답하고 출처 연결 해줘.","better_example":"목표: 검색 문서만 근거로 질문에 답하고 출처 연결\n입력: {{retrieved_chunks}} + {{question}}\n출력: 답변, source_id, 자료부족 표시\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 검색 문서만 근거로 질문에 답하고 출처 연결하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{retrieved_chunks}} + {{question}}\n</question_or_input>\n\n출력: 답변, source_id, 자료부족 표시","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-098','rag-incident','RAG grounded','운영','중급','운영 · RAG grounded 패턴','장애 로그를 triage하고 다음 조치 순서를 제안','제공된 <sources>만 사용하여 장애 로그를 triage하고 다음 조치 순서를 제안하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{alerts_logs_context}}
</question_or_input>

출력: 영향, 가설, 확인 명령, 완화, 에스컬레이션','영향, 가설, 확인 명령, 완화, 에스컬레이션','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{alerts_logs_context}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"장애 로그를 triage하고 다음 조치 순서를 제안 — 입력은 {{alerts_logs_context}}만 넣고 결과를 영향, 가설, 확인 명령, 완화, 에스컬레이션 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"장애 로그를 triage하고 다음 조치 순서를 제안 해줘.","better_example":"목표: 장애 로그를 triage하고 다음 조치 순서를 제안\n입력: {{alerts_logs_context}}\n출력: 영향, 가설, 확인 명령, 완화, 에스컬레이션\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 장애 로그를 triage하고 다음 조치 순서를 제안하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{alerts_logs_context}}\n</question_or_input>\n\n출력: 영향, 가설, 확인 명령, 완화, 에스컬레이션","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-099','rag-api','RAG grounded','API 통합','중급','API 통합 · RAG grounded 패턴','API 문서에서 안전한 통합 절차와 예제 코드를 작성','제공된 <sources>만 사용하여 API 문서에서 안전한 통합 절차와 예제 코드를 작성하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{api_docs_and_goal}}
</question_or_input>

출력: 요청/응답 예제, 오류처리, 보안 주의','요청/응답 예제, 오류처리, 보안 주의','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{api_docs_and_goal}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"API 문서에서 안전한 통합 절차와 예제 코드를 작성 — 입력은 {{api_docs_and_goal}}만 넣고 결과를 요청/응답 예제, 오류처리, 보안 주의 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"API 문서에서 안전한 통합 절차와 예제 코드를 작성 해줘.","better_example":"목표: API 문서에서 안전한 통합 절차와 예제 코드를 작성\n입력: {{api_docs_and_goal}}\n출력: 요청/응답 예제, 오류처리, 보안 주의\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 API 문서에서 안전한 통합 절차와 예제 코드를 작성하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{api_docs_and_goal}}\n</question_or_input>\n\n출력: 요청/응답 예제, 오류처리, 보안 주의","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
insert into public.prompt_examples(id,slug,pattern,domain,difficulty,title,intent,prompt_text,expected_output,recommended_model_snapshot,measurement_status,measured_result,source_refs,last_verified,metadata) values ('prompt-100','rag-cleanup','RAG grounded','데이터 정리','중급','데이터 정리 · RAG grounded 패턴','불규칙한 텍스트/레코드를 정규화 규칙에 맞게 변환','제공된 <sources>만 사용하여 불규칙한 텍스트/레코드를 정규화 규칙에 맞게 변환하세요.

규칙:
- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.
- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.
- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.

<sources>
{{retrieved_chunks}}
</sources>

<question_or_input>
{{raw_records}}
</question_or_input>

출력: 정규화 결과, 변경 사유, 미확정 값','정규화 결과, 변경 사유, 미확정 값','provider-agnostic; model/version별 재평가 필요','unspecified — 로컬 eval 필요',null,array['rag-paper','self-rag']::text[],'2026-09-21'::date,'{"type":"prompt","pattern_id":"rag","test_input":"{{raw_records}}","when_to_use":"검색된 근거 안에서만 답하고 출처를 연결","when_not_to_use":"업무 성공 기준과 입력 데이터가 정의되지 않은 상태에서 형식만 복잡하게 만들 때는 먼저 문제 정의와 eval부터 정리하세요.","quick_mode":"불규칙한 텍스트/레코드를 정규화 규칙에 맞게 변환 — 입력은 {{raw_records}}만 넣고 결과를 정규화 결과, 변경 사유, 미확정 값 형식으로 제한합니다.","verification":"대표 입력 5~20개를 고정하고 정확도/누락/형식 위반/비용을 baseline과 비교하세요.","common_mistake":"예시 1회 성공을 일반화하거나 모델 버전 변경 뒤 재평가하지 않는 것.","evidence_level":"Original research + official","risk_tags":["model-drift","needs-eval"],"bad_example":"불규칙한 텍스트/레코드를 정규화 규칙에 맞게 변환 해줘.","better_example":"목표: 불규칙한 텍스트/레코드를 정규화 규칙에 맞게 변환\n입력: {{raw_records}}\n출력: 정규화 결과, 변경 사유, 미확정 값\n불확실한 내용은 확인 필요로 표시하세요.","best_example":"제공된 <sources>만 사용하여 불규칙한 텍스트/레코드를 정규화 규칙에 맞게 변환하세요.\n\n규칙:\n- 모든 핵심 사실 뒤에 [source_id]를 붙이세요.\n- 자료에서 확인되지 않으면 ''자료에서 확인 불가''라고 답하세요.\n- 출처가 충돌하면 양쪽 내용을 함께 표시하세요.\n\n<sources>\n{{retrieved_chunks}}\n</sources>\n\n<question_or_input>\n{{raw_records}}\n</question_or_input>\n\n출력: 정규화 결과, 변경 사유, 미확정 값","why_it_works":"모델의 일반 지식과 제공된 근거를 분리하고, 출처 밖 내용은 모른다고 답하게 해 환각을 줄입니다.","application_tip":"처음에는 대표 입력 5~20개로 baseline을 만든 뒤, 프롬프트나 모델을 바꿀 때 같은 입력으로 회귀 평가하세요."}'::jsonb) on conflict(id) do update set slug=excluded.slug,pattern=excluded.pattern,domain=excluded.domain,difficulty=excluded.difficulty,title=excluded.title,intent=excluded.intent,prompt_text=excluded.prompt_text,expected_output=excluded.expected_output,recommended_model_snapshot=excluded.recommended_model_snapshot,measurement_status=excluded.measurement_status,measured_result=excluded.measured_result,source_refs=excluded.source_refs,last_verified=excluded.last_verified,metadata=excluded.metadata;
commit;
