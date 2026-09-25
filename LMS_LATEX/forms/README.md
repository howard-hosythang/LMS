# Required signed forms

Place the scanned signed PDF file in this folder with this exact name before building the final submission PDF:

- `phieu_nhiem_vu.pdf` (one PDF containing the assignment form, advisor grading form, and reviewer grading form)

`main.tex` includes this file automatically. If the file is missing, the generated report shows a placeholder page so the missing item is visible during review.

To build two PDF variants, change this switch in `main.tex`:

```tex
\includeSignedFormstrue   % includes the three signed forms
\includeSignedFormsfalse  % skips the three signed forms
```

Build once with `true` for the full submission PDF, then change to `false` and build again for the version without forms.
