$pdf_mode = 1;
$out_dir = 'build';
$jobname = 'HK253-DATN-076_2213214';
$pdflatex = 'pdflatex %O -interaction=nonstopmode -synctex=1 -file-line-error %S';

# latexmk runs BibTeX from $out_dir.  Without this explicit lookup directory,
# MiKTeX can select an unrelated, globally installed `references.bib` instead
# of the bibliography at the project root.
$bibtex = 'bibtex -include-directory=.. %O %B';
