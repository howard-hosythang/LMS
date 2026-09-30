PROJECT := HK253-DATN-076_2213214
MAIN := main.tex
BUILD_DIR := build

.PHONY: all pdf clean distclean

all: pdf

pdf:
	latexmk -pdf -interaction=nonstopmode -synctex=1 -file-line-error -outdir=$(BUILD_DIR) -jobname=$(PROJECT) $(MAIN)
	cp $(BUILD_DIR)/$(PROJECT).pdf $(PROJECT).pdf

clean:
	latexmk -c -outdir=$(BUILD_DIR) -jobname=$(PROJECT) $(MAIN)

distclean:
	latexmk -C -outdir=$(BUILD_DIR) -jobname=$(PROJECT) $(MAIN)
	rm -f $(PROJECT).pdf
