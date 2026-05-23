# Licensly SCO vs. Text-to-SQL Benchmark Questions

This file contains the complete set of 60 licence governance benchmark questions used to evaluate the Structured Context-Object (SCO) interface against the Text-to-SQL (T2S) baseline in the paper:

> **Licensly: Design, Implementation, and Evaluation of an AI-Powered Corporate SaaS Licence Management and Compliance Automation Platform**
> Prof. M. S. Sawalkar, Rushikesh R. Navale, Shashwat Patil, Lav Parab
> AISSMS Institute of Information Technology, Pune, India

Questions are organised into four difficulty categories (15 questions each). Ground-truth answers were independently labelled by two annotators using direct database queries against the seeded Acme Corp dataset (Cohen's κ = 0.89).

---

## Category 1: Simple Aggregation (Q1–Q15)
*These questions require a single aggregate computation over one table.*

| # | Question |
|---|---|
| Q1 | What is our total monthly spend across all licences? |
| Q2 | What is our total annual spend across all licences? |
| Q3 | How many licences do we currently have active? |
| Q4 | How many total seats have we purchased across all platforms? |
| Q5 | How many total seats are currently in use? |
| Q6 | How many unused seats do we have in total? |
| Q7 | How many licences are expiring this month? |
| Q8 | How many integrations are currently connected? |
| Q9 | What is our overall seat utilisation rate as a percentage? |
| Q10 | How many licence assignments have an idle status? |
| Q11 | What is the average cost per seat across all licences? |
| Q12 | How many licences are on a monthly billing cycle? |
| Q13 | How many licences are on an annual billing cycle? |
| Q14 | How many open compliance alerts do we currently have? |
| Q15 | How many pending optimisation recommendations are there? |

---

## Category 2: Cross-Table Join (Q16–Q30)
*These questions require joining or correlating data across two or more tables.*

| # | Question |
|---|---|
| Q16 | Which licences have more than 20% idle users? |
| Q17 | Which platforms have seats used exceeding seats purchased? |
| Q18 | Which licences have zero active users in the last 30 days? |
| Q19 | Which users are assigned to more than one platform licence? |
| Q20 | Which integrations have not been synced in the last 7 days? |
| Q21 | Which licences have a utilisation rate below 50%? |
| Q22 | What is the total monthly spend on licences with below 30% utilisation? |
| Q23 | Which platforms have both a compliance alert and an optimisation recommendation? |
| Q24 | Which licences have idle assignments but no optimisation recommendation yet? |
| Q25 | What percentage of our total spend goes to platforms with utilisation above 80%? |
| Q26 | Which users have been idle for more than 60 days across any platform? |
| Q27 | How many licences have critical compliance alerts currently unresolved? |
| Q28 | Which platforms account for the top 50% of our total monthly spend? |
| Q29 | How many licence assignments exist per platform on average? |
| Q30 | Which licences have more purchased seats than the total number of assigned users? |

---

## Category 3: Trend Reasoning (Q31–Q45)
*These questions require temporal reasoning, date comparisons, or pattern identification.*

| # | Question |
|---|---|
| Q31 | Which platforms renew within the next two weeks? |
| Q32 | Which licences are expiring within the next 30 days? |
| Q33 | Which licences expired in the past but are still marked active? |
| Q34 | How much will we spend on licence renewals in the next 30 days? |
| Q35 | Which platforms have renewal dates falling in the same month? |
| Q36 | How many licences renew in Q1 of next year? |
| Q37 | Which licences have had no usage activity in the last 90 days? |
| Q38 | Which platforms have shown increasing idle user counts over time? |
| Q39 | How much of our annual spend is concentrated in the next 60-day renewal window? |
| Q40 | Which licences were added most recently to our portfolio? |
| Q41 | Which compliance alerts have been unresolved for more than 14 days? |
| Q42 | What is the total cost of licences renewing in the next quarter? |
| Q43 | Which platforms have had their licence count changed in the last sync? |
| Q44 | How many licences have renewal dates within 7 days of each other, risking a cash flow spike? |
| Q45 | Which integrations were last synced more than 24 hours ago? |

---

## Category 4: Contextual Recommendation (Q46–Q60)
*These questions require multi-factor reasoning and strategic judgement.*

| # | Question |
|---|---|
| Q46 | Where should we reduce spend first? |
| Q47 | Which licences should we consider downgrading to a lower tier? |
| Q48 | Which subscriptions should we consolidate or eliminate? |
| Q49 | If we removed all licences below 30% utilisation, how much would we save monthly? |
| Q50 | Which platforms offer the worst value for money based on cost and utilisation? |
| Q51 | What is our single largest cost-saving opportunity right now? |
| Q52 | Which vendors should we prioritise for renegotiation at renewal time? |
| Q53 | Which platforms are we most at risk of a compliance violation on? |
| Q54 | If we capped all licences at their current active user count, how much would we save? |
| Q55 | Which departments are driving the highest licence waste? |
| Q56 | Should we renew or cancel the licence with the lowest utilisation rate? |
| Q57 | What percentage of our total spend could be recovered through optimisation? |
| Q58 | Which platform licences are redundant given overlapping feature sets? |
| Q59 | What is the most cost-effective set of actions to reduce monthly spend by 20%? |
| Q60 | Given our current compliance alerts and spend profile, what should we address first? |

---

## Annotation Protocol

Ground-truth answers were derived as follows:

- **Q1–Q30:** Deterministic SQL queries executed against the Acme Corp seeded dataset (see `supabase/seed.sql`) producing exact numerical answers.
- **Q31–Q45:** SQL queries with date arithmetic anchored to the evaluation date, producing exact lists or numerical totals.
- **Q46–Q60:** Two annotators independently wrote reference answers based on the seeded data. Answers were accepted when both annotators agreed on the recommended action and primary justification. Cohen's κ = 0.89 across all 60 questions.

**Annotator blinding:** During SCO and T2S evaluation, annotators scoring system responses were different individuals who had not seen the ground-truth labels, ensuring blinded assessment.

---

## Dataset Reference

All questions were evaluated against the Licensly production seeded dataset representing:
- 1 organisation (Acme Corp, enterprise plan)
- 50 licences across 12 platforms
- ~300 licence assignment records
- 7 connected integrations
- 13 injected compliance violations
- 20 pre-seeded optimisation recommendations

For access to the full seeded dataset, refer to `supabase/seed.sql` in this repository.

---

## Citation

If you use this benchmark in your work, please cite:

```
@article{licensly2025,
  title     = {Licensly: Design, Implementation, and Evaluation of an AI-Powered 
               Corporate SaaS Licence Management and Compliance Automation Platform},
  author    = {Sawalkar, M. S. and Navale, Rushikesh R. and Patil, Shashwat and Parab, Lav},
  journal   = {[Journal Name]},
  year      = {2025},
  institution = {AISSMS Institute of Information Technology, Pune, India}
}
```
