Feature: Validators
  As a developer
  I want to validate user input
  So that the application remains secure and clean

  # Test 1: Password Validation
  Scenario: Strong password is accepted
    Given a password "SecurePass123"
    When I validate the password
    Then the password should be valid

  Scenario: Weak password is rejected
    Given a password "weak"
    When I validate the password
    Then the password should be invalid

  # Test 2: Profanity Filter
  Scenario: Clean content is allowed
    Given content "Hello, this is a nice post!"
    When I check for profanity
    Then the content should be allowed

  Scenario: Profane content is blocked
    Given content "This is a damn post"
    When I check for profanity
    Then the content should be blocked

  # Test 3: Group Name Validation
  Scenario: Valid group name is accepted
    Given a group name "Tech Lovers"
    And no existing groups
    When I validate the group name
    Then the group name should be valid

  Scenario: Short group name is rejected
    Given a group name "AB"
    And no existing groups
    When I validate the group name
    Then the group name should be invalid
