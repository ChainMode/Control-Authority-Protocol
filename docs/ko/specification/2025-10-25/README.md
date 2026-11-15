---
title: 제어 권한 프로토콜(CAP) 1.0 기술 사양서
description: Control Authority Protocol (CAP) 1.0 정식 사양서 개요, 장별 구성 및 적합성 자산 색인
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
replaces: draft@5bbc1a5
---

# 제어 권한 프로토콜(CAP) 1.0 기술 사양서

본 디렉터리는 **Control Authority Protocol(CAP, 제어 권한 프로토콜) 1.0** 정식 확정 사양(판차 `2025-10-25`, 상태 `Final`)을 수록한다. CAP은 디지털 아바타(`iFay` 또는 `coFay`)가 `Human Prime`(인간 프라임)이 발급한 위임 증빙을 바탕으로, 빙의(`Inhabit`)된 호스트(`Host`, 단말 장치 또는 클라이언트 애플리케이션만을 지칭함)의 하드웨어 및 소프트웨어 제어권을 안전하게 요청·행사·반환하는 규범적 절차를 정의한다.

## 사양서 장별 구성

| 장 | 파일 | 규범적 핵심 내용 |
|----|------|------------------|
| 제0장 | `00-개요와 규범적 용어.md` | 프로토콜 적용 범위와 비목표, RFC 2119 / RFC 8174 규범 키워드 매핑 선언, 핵심 용어 정의, 직교하는 3개 버전 축과 2세그먼트 `"1.0"` 버전 규율 |
| 제1장 | `01-아키텍처와 바인딩 모델.md` | 프로토콜 역할과 책임 경계, Faying 신뢰 당사자(Relying Party)로서의 단락 평가 파이프라인, `Mandate` 3종 바인딩 모델(Model B / Model A+B / Model C 금지 규칙) 및 금융 이체 범위 제외 |
| 제2장 | `02-인가 등급과 위험도 매트릭스.md` | 비계층적 4종 리소스 접근 모드(`read` / `write` / `execute` / `configure`), 4단계 작업 위험도 및 `FayingGrade × AccessMode × Criticality` 보수적 판정 매트릭스 |
| 제3장 | `03-드라이버 능력 매니페스트와 비가역성 하한.md` | Ed25519 서명 기반 `DriverCapabilityManifest`, 미선언 작업의 기본 `critical` 거부, `consequence_irreversibility` 비가역성 하한 및 단조 상향 불변식 |
| 제4장 | `04-고위험 인간 프라임 확인과 안전 상태.md` | 매개변수 SHA-256 결합형 명시적 `Human Prime` 확인 게이트, `G0` 긴급 인수 시 비차단 `G0SafeStateDirective`, 표준 에러 코드표 및 적합성 판정 기준 |

## 동반 규범 산출물

본 사양서 본문은 다음 기계 가독 자산과 함께 CAP 1.0 상호운용 베이스라인을 구성한다.

- **CDDL 와이어 형식 권위 정의**: `schemas/cap-1.0.cddl`
- **JSON Schema 2020-12 권위 정의**: `schemas/cap-1.0.json`(및 배포 스냅샷 `schema/2025-10-25/schema.json`)
- **의미론적 적합성 테스트 벡터**: `vectors/semantic/d1-d7-conformance.json`(정상·비정상 경계를 포괄하는 14개 표준 벡터)
- **이중 언어 레퍼런스 구현**: TypeScript 레퍼런스 평가기(`src/`) 및 Rust 레퍼런스 평가기(`reference-impls/rust/`)

## 외부 프로토콜 참조 경계

- `Human Prime`(인간 프라임) 및 디지털 아바타 식별자 체계는 **FayID**에서 권위 있게 정의한다(`FayID` 참조).
- 인가 위임(`Mandate`), 자율 등급(`G0`–`G4`) 및 재석 신선도 의미론은 **Faying-Protocol**에서 권위 있게 정의한다(`Faying-Protocol` 참조).
- 런타임 호스트 주입 및 드라이버 매니페스트 적재 수명주기는 **FayGer**에서 권위 있게 정의한다(`FayGer` 참조).
- 사회 공헌 원장인 공예체인(`GMChain`)과 비화폐성 공헌 단위인 `MeriToken`은 **Global-Merit-Chain**에서 권위 있게 정의한다(`Global-Merit-Chain` 참조).
