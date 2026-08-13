# Subtraction Eval Scorecard

Score the patch without seeing the model identity.

## Hard gate

- [ ] Behavior pin and final checks pass.
- [ ] No requested behavior changed.
- [ ] Changes stay inside the allowed surface.
- [ ] No unsupported compatibility path remains.
- [ ] No speculative abstraction or configuration was added.

Any unchecked item invalidates the run.

## Reader load

Record before and after counts where applicable:

| Dimension | Before | After |
| --- | ---: | ---: |
| Concepts a caller must know | | |
| Execution paths or branches | | |
| Public exports or methods | | |
| Representations of the same concept | | |
| Indirection hops on the changed flow | | |
| Files touched to understand the behavior | | |
| Compatibility aliases, flags, or dual paths | | |

## Outcome

- Net added/deleted lines:
- Changed files:
- Added dependencies:
- Elapsed time:
- Input/output tokens and cost:
- Reviewer confidence, 1-5:
- Accepted deletion proposals / total proposals:
- Residual complexity required by the contract:
- Verdict: accept / reject / indistinguishable from baseline
