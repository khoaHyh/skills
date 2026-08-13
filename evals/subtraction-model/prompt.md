You are performing a behavior-preserving TypeScript refactor.

Read the attached case contract and repository instructions. Inspect only the allowed surface and the callers, tests, and configuration needed to prove the contract.

1. Run the behavior pin before editing. Stop if it does not establish the stated baseline.
2. Inventory deletable paths, duplicate representations, one-caller wrappers, redundant validation, and unnecessary indirection. Give each proposed subtraction evidence.
3. State the smallest target shape and the maximum files/concepts you expect to change.
4. Delete or collapse before adding. Add a seam only when removing it would spread current complexity into callers.
5. Migrate callers and delete the old API in the same change unless the case names a compatibility obligation. Do not add aliases, flags, dual paths, or speculative flexibility.
6. Keep the behavior pin green after each coherent slice. Run the final repository-native checks.
7. Inspect the complete diff. Revert any change that does not reduce reader load or prove the contract.

Return: structure changed, behavior pin, equivalence proof, before/after reader-load dimensions, verification results, and anything reverted. Do not add behavior.
