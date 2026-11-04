# Evidence

What each rule in the skill stands on, how strong that evidence is, and where it stops. When the learner asks "why are we doing this?", answer from here. Strength labels: **meta** (meta-analysis), **exp** (controlled experiment), **review**, **frame** (a theory or design framework, not effect-size evidence).

The backbone with the broadest support is spaced retrieval with corrective feedback. Everything else depends on the learner's prior knowledge, the material, and how well it's done. Most of this research comes from classrooms and labs, not from adults teaching themselves with an AI, so treat the prescriptions as evidence-informed rather than proven for this exact setting.

## The goal: a runnable model, shown through performance

- Mental models are internal representations people run to predict and explain. Johnson-Laird 1983, *Mental Models*; Gentner & Stevens (eds.) 1983, *Mental Models*. **frame**
- Understanding is shown by using an idea flexibly (explaining, applying, predicting), not by repeating it. Perkins & Blythe 1994, *Educational Leadership* 51(5) ("performances of understanding"); Wiggins & McTighe 2005, *Understanding by Design*. These two also give backward design: define the evidence of learning first, then plan the teaching (step 2). **frame**
- Experts sort problems by deep principle; novices sort by surface features. Chi, Feltovich & Glaser 1981, *Cognitive Science* 5(2), doi:10.1207/s15516709cog0502_2. **exp** This is why final items share deep structure and vary the surface.
- A chunk is a learned pattern that compresses expertise; experts' recall advantage disappears on random chess positions. Chase & Simon 1973, *Cognitive Psychology* 4(1). Oakley, *A Mind for Numbers* (2014), ch. 4, describes how a chunk forms: focused attention, grasping the basic idea, then practice to learn when to use it. **exp / frame**

## Illusions of competence

- Rereading and familiarity feel like learning but don't produce recall. Oakley 2014, ch. 4 and Karpicke's preface. Dunlosky et al. 2013, *Psychological Science in the Public Interest* 14(1), doi:10.1111/j.1539-6053.2013.01069.x, rated rereading, highlighting and summarizing low utility, and practice testing and distributed practice high utility. **review**
- Restudying raised learners' confidence while lowering their recall a week later (56% for retrieval vs 42% for restudy, d = 0.83). Roediger & Karpicke 2006, *Psychological Science* 17(3), doi:10.1111/j.1467-9280.2006.01693.x. **exp**
- People overrate how well they understand mechanisms until asked to explain them step by step: the illusion of explanatory depth. Rozenblit & Keil 2002, *Cognitive Science* 26(5), doi:10.1207/s15516709cog2605_1. **exp** This is the rate, explain, re-rate probe in placement.
- Overconfidence leads learners to stop studying too early. Dunlosky & Rawson 2012, *Learning and Instruction* 22(4), doi:10.1016/j.learninstruc.2011.08.003. **exp** This is why progress depends on delayed, unaided performance, never on "feels familiar".

## Attempt first, and the AI-specific risk

- Generating an answer beats reading it. Slamecka & Graf 1978, *JEP: Human Learning and Memory* 4(6). **exp**
- Students with unrestricted GPT-4 access did better during practice but 17% worse on the unaided exam. A tutor version with guardrails (hints, not answers) largely removed the harm. Bastani et al. 2025, *PNAS*, doi:10.1073/pnas.2422633122. **exp** (field RCT)
- Developers learning a new library with AI assistance scored 50% on a follow-up quiz, against 67% without it (d = 0.74). Those who asked conceptual questions, or generated code and then worked to understand it, scored better (a correlational pattern). Shen & Tamkin 2026, arXiv:2601.20245. **exp**
- External aids can leave you knowing where to find something rather than holding it, and intuition and critical thinking run on knowledge held in your head. Oakley, Johnston, Chen, Jung & Sejnowski 2025, "The Memory Paradox", arXiv:2506.11015. **review** (an argument, not proof of harm)
- A structured AI tutor beat in-class active learning on an immediate post-test (about 0.63 SD; 0.73–1.3 SD by quantile regression). It followed seven practices: active learning, managing cognitive load, growth mindset, scaffolding, accurate feedback, timely feedback, self-pacing. Its accuracy depended on pre-written step-by-step solutions, and a system prompt alone could not keep multi-part problems in order. Kestin et al. 2025, *Scientific Reports* 15:17458, doi:10.1038/s41598-025-97652-6. **exp** The pre-written solutions are why you write the reference answer before grading; the sequencing finding is why the step structure here is explicit.
- Study modes and learning modes (OpenAI, Anthropic, Google LearnLM) describe Socratic and scaffolded behavior. They are product designs, not independent evidence.

## Hints, scaffolds, fading

- Scaffolding means recruiting interest, reducing degrees of freedom, keeping direction, marking critical features, managing frustration, and demonstrating, then withdrawing as control grows. Wood, Bruner & Ross 1976, *J. Child Psychology and Psychiatry* 17(2). **exp** (observational) The zone of proximal development: Vygotsky 1978. **frame** Cognitive apprenticeship (model, coach, scaffold, fade, articulate, reflect, explore): Collins, Brown & Newman 1989. **frame**
- Worked examples beat unguided problem solving for novices. Sweller & Cooper 1985, *Cognition and Instruction* 2(1). **exp** Fade the worked steps toward independent solving: Renkl, Atkinson & Große 2004, *Instructional Science* 32. **exp**
- Guidance that helps novices becomes redundant or harmful for learners who already hold the schema: the expertise reversal effect. Kalyuga, Ayres, Chandler & Sweller 2003, *Educational Psychologist* 38(1). **review** Minimal guidance fails novices: Kirschner, Sweller & Clark 2006, *Educational Psychologist* 41(2). **review**

## Teach small

- Working memory is narrow, and unguided search uses it up without building schemas. Sweller 1988, *Cognitive Science* 12(2). **exp / frame**
- Words and aligned graphics beat words alone. Segment the material, signal the structure, cut decoration. Mayer, *Cambridge Handbook of Multimedia Learning*, 3rd ed. (2021); dual coding, Paivio 1986. **review / frame**
- Analogies transfer through shared relations, not shared surfaces, and learners seldom notice a useful analogy unprompted. So map the analogy explicitly and say where it breaks. Gentner 1983, *Cognitive Science* 7(2); Gick & Holyoak 1980 and 1983, *Cognitive Psychology*. **exp** Comparing cases beats studying them one at a time (d = 0.50): Alfieri, Nokes-Malach & Schunn 2013, *Educational Psychologist* 48(2). **meta**

## Feedback and misconceptions

- High-confidence errors are corrected more readily than low-confidence ones once feedback arrives: the hypercorrection effect. Butterfield & Metcalfe 2001, *JEP: LMC* 27(6). **exp**
- Conceptual change needs dissatisfaction with the old idea, plus a new idea that is intelligible, plausible and fruitful. Posner et al. 1982, *Science Education* 66(2). **frame** A wrong answer may be an intuition triggered by context rather than a coherent false theory, so ask for the reasoning before naming a misconception. diSessa 1993, *Cognition and Instruction* 10(2–3). **frame**
- Predict, observe, explain: White & Gunstone 1992, *Probing Understanding*. **frame** A contradiction on its own rarely revises a belief; it needs the explanation and a later retest.

## Space, mix, vary

- The best review gap grows with how long you want to remember. For a one-week horizon it is about 20–40% of that horizon; for a year, about 5–10%. Cepeda et al. 2006, *Psychological Bulletin* 132(3) **meta**; Cepeda et al. 2008, *Psychological Science* 19(11) **exp**. Hence 1, 3 and 7 days, stretched for longer goals.
- Initial recall tests benefit retention more than recognition tests. Rowland 2014, *Psychological Bulletin* 140(6). **meta** Retrieval improves transfer to new inference questions, not only to the practiced wording. Butler 2010, *JEP: LMC* 36(5). **exp**
- Retrieval practice beat studying with concept maps, even on a final concept-mapping test. Karpicke & Blunt 2011, *Science* 331. **exp** This is why drawings are made from memory, not copied.
- Interleaving helps when the categories are similar and easy to confuse; it can hurt with expository text and word lists. Brunmair & Richter 2019, *Psychological Bulletin* 145(11), doi:10.1037/bul0000209. **meta** Rohrer & Taylor 2007 (mathematics). **exp**
- In real school classrooms: retrieval g = 0.37, spacing g = 0.20, interleaving g = 0.40, all moderated by knowledge type, test format and feedback. Ruitenburg et al. 2026, *Educational Psychology Review* 38(1), doi:10.1007/s10648-026-10225-5. **meta**

## Durable: successive relearning

- Retrieving to criterion in a first session, then relearning to one correct recall in each later spaced session, produced durable retention 1–4 months on, with diminishing returns after a few sessions. Rawson & Dunlosky 2011, *JEP: General* 140(3), doi:10.1037/a0023956 (533 students; 1–4 initial recalls, 1–5 relearning sessions) **exp**; classroom replication, Rawson, Dunlosky & Sciartelli 2013 **exp**; review, Rawson & Dunlosky 2022, *Current Directions* 31(4) **review**.
- No universal count exists. "Correct unaided recall in two later sessions on different days" is this skill's local rule, chosen to keep a 101 bounded. Raise it when the learner needs the topic for longer. Counting placement as the first retrieval for a chunk the learner already held is also a local call. That knowledge was learned before the course and has already survived a delay, which is what spacing exists to produce.

## Pretest, productive failure, telling

- Questions asked before teaching improve later learning even when answered wrong, provided the teaching that follows resolves them. Richland, Kornell & Kao 2009, *JEP: Applied* 15(3) **exp**; Pan & Carpenter 2023, *Educational Psychology Review* 35 **review**.
- Problem solving before instruction beat instruction first (g = 0.36). The effect reversed for young learners and for domain-general skills. Kapur 2008, *Cognition and Instruction* 26(3) **exp**; Sinha & Kapur 2021, *Review of Educational Research* 91(5) **meta**. Telling works best once learners have enough differentiated knowledge to process it: Schwartz & Bransford 1998, "A time for telling". **exp** Hence design-before-reveal only for learners with enough prior knowledge.

## Generating, explaining, teaching

- Prompted self-explanation improves learning (g ≈ 0.55), and the prompts should be specific. Chi et al. 1989 and 1994, *Cognitive Science* **exp**; Bisra et al. 2018, *Educational Psychology Review* 30(3) **meta**.
- Engagement climbs from passive to active to constructive to interactive (ICAP). Chi & Wylie 2014, *Educational Psychologist* 49(4). **frame**
- Preparing to teach organizes knowledge, and actually explaining adds to that. Nestojko et al. 2014, *Memory & Cognition* 42 **exp**; Fiorella & Mayer 2013, *Contemporary Educational Psychology* 38(4) **exp**. Eight generative strategies (summarizing, mapping, drawing, imagining, self-testing, self-explaining, teaching, enacting): Fiorella & Mayer 2016, *Educational Psychology Review* 28(4). **review**

## Drawing and maps

- Drawing improves recall. Wammes, Meade & Fernandes 2016, *QJEP* 69(9). **exp** Learner drawings help when prompted and given feedback, and fail when the learner lacks the knowledge to depict the idea. Fiorella & Zhang 2018, *Educational Psychology Review* 30. **review**
- A drawing-to-learn meta-analysis reported a smaller effect on transfer than on learning. Cromley et al. 2020, *J. Science Education and Technology*, doi:10.1007/s10956-019-09807-6. **meta** Hence every drawing build ends with a scenario run through the drawing.
- Building concept maps supports learning. Schroeder et al. 2018, *Educational Psychology Review* 30(2), doi:10.1007/s10648-017-9403-9. **meta** Grade the propositions (node, labelled link, node), not the layout.

## Learning without hand-coding

- Novices' weak code reading and tracing undercut their code writing. Lister et al. 2004, ITiCSE working group. **exp** Teach tracing and reading before writing: Xie et al. 2019, *Computer Science Education* 29(2–3), doi:10.1080/08993408.2019.1565235. **frame**
- The notional machine is the learner's model of how execution changes state. Sorva 2013, *ACM TOCE*, doi:10.1145/2483710.2483713; Fincher et al. 2020. **review**
- PRIMM (predict, run, investigate, modify, make) in 13 schools with 493 students. Sentance, Waite & Kallia 2019, *Computer Science Education*, doi:10.1080/08993408.2019.1615491. **exp**
- No study yet shows that writing only the kernel by hand keeps all the benefit of a full build. Treat kernel-by-hand as a reasonable bet.

## Focused, diffuse, sessions

- Focused and diffuse modes, Einstellung, and the Pomodoro method (25 focused minutes, then a break): Oakley 2014, ch. 2, pp. 11–25. The two modes are a teaching metaphor, not a full account of the brain. **frame**
- Look away and recall (Oakley's "pause and recall"), p. 26. This is the exit ticket.

## Formats and "learning styles"

- Matching teaching to a learner's preferred "style" has no adequate evidence of improving learning. Pashler, McDaniel, Rohrer & Bjork 2008, *Psychological Science in the Public Interest* 9(3). **review** Offering channels for comfort is fine; choosing the build by the shape of the content is what counts.

## The final and when to stop

- Performance during learning is a poor guide to learning; delayed, unsupported tests are a good one. Soderstrom & Bjork 2015, *Perspectives on Psychological Science* 10(2). **review**
- Mastery learning (bounded units, a criterion test, corrective teaching, a retest) raised exam scores about 0.52 SD across 108 evaluations. Kulik, Kulik & Bangert-Drowns 1990, *Review of Educational Research* 60(2). **meta** Bloom 1968 **frame**. Bloom 1984's "2 sigma" pooled a few small studies; borrow its mechanism and don't promise its number.
- Preparation for future learning: measure transfer as the ability to learn something new from a fresh resource. Bransford & Schwartz 1999, *Review of Research in Education* 24, doi:10.3102/0091732X024001061. **frame** This is the PFL item and the skill's definition of "can teach themselves".
- Label how far each transfer item reaches: knowledge domain, context, time, function, modality. Barnett & Ceci 2002, *Psychological Bulletin* 128(4). **frame**
- Thresholds such as "both items right" or "≥ 85%" are local operational choices. The research supports the components (criterion, spacing, delay, transfer, PFL), not the exact numbers.

## Syntheses worth reading

*How People Learn* (NRC 2000) and *How People Learn II* (NASEM 2018); Ambrose et al. 2010, *How Learning Works*; Brown, Roediger & McDaniel 2014, *Make It Stick*; Oakley & Sejnowski, *Learning How to Learn* (Coursera; book 2018); Oakley, Rogowsky & Sejnowski 2021, *Uncommon Sense Teaching*.
