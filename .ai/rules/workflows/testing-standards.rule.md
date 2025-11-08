# Testing Standards
## Purpose
Ensure comprehensive test coverage and quality testing practices

## Instructions
- Write tests for all new features and bug fixes (ID: TEST_NEW_CODE)
- Follow testing pyramid: many unit tests, some integration tests, few E2E tests (ID: TESTING_PYRAMID)
- Use descriptive test names that explain what is being tested (ID: DESCRIPTIVE_TEST_NAMES)
- Follow AAA pattern: Arrange, Act, Assert (ID: AAA_PATTERN)
- Test edge cases and error conditions, not just happy paths (ID: TEST_EDGE_CASES)
- Keep tests isolated - no dependencies between tests (ID: TEST_ISOLATION)
- Use test doubles (mocks, stubs, fakes) appropriately (ID: TEST_DOUBLES)
- Aim for high code coverage but prioritize meaningful tests over coverage percentage (ID: MEANINGFUL_COVERAGE)
- Run tests before committing code (ID: TEST_BEFORE_COMMIT)
- Fix failing tests immediately - never commit broken tests (ID: FIX_FAILING_TESTS)

## Priority
High

## Error Handling
- If test framework not found, suggest installation and setup
- If tests fail, provide clear explanation of failure and suggested fixes
- If coverage drops, note the decrease and suggest areas needing tests
