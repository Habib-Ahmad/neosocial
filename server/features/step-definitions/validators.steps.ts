import { Given, When, Then } from "@cucumber/cucumber";
import { strict as assert } from "assert";
import { validatePassword, checkProfanity, validateGroupName } from "../../utils/validators.js";

// State
let password: string;
let content: string;
let groupName: string;
let existingGroups: string[];
let passwordResult: { isValid: boolean; errors: string[] };
let profanityResult: { isValid: boolean; errors: string[] };
let groupNameResult: { isValid: boolean; errors: string[] };

// ===== PASSWORD STEPS =====

Given("a password {string}", function (pwd: string) {
  password = pwd;
});

When("I validate the password", function () {
  passwordResult = validatePassword(password);
});

Then("the password should be valid", function () {
  assert.strictEqual(
    passwordResult.isValid,
    true,
    `Expected valid but got errors: ${passwordResult.errors.join(", ")}`
  );
});

Then("the password should be invalid", function () {
  assert.strictEqual(passwordResult.isValid, false, "Expected password to be invalid");
});

// ===== PROFANITY STEPS =====

Given("content {string}", function (text: string) {
  content = text;
});

When("I check for profanity", function () {
  profanityResult = checkProfanity(content);
});

Then("the content should be allowed", function () {
  assert.strictEqual(profanityResult.isValid, true, "Content should be allowed");
});

Then("the content should be blocked", function () {
  assert.strictEqual(profanityResult.isValid, false, "Content should be blocked");
});

// ===== GROUP NAME STEPS =====

Given("a group name {string}", function (name: string) {
  groupName = name;
});

Given("no existing groups", function () {
  existingGroups = [];
});

When("I validate the group name", function () {
  groupNameResult = validateGroupName(groupName, existingGroups);
});

Then("the group name should be valid", function () {
  assert.strictEqual(
    groupNameResult.isValid,
    true,
    `Expected valid but got errors: ${groupNameResult.errors.join(", ")}`
  );
});

Then("the group name should be invalid", function () {
  assert.strictEqual(groupNameResult.isValid, false, "Expected group name to be invalid");
});
