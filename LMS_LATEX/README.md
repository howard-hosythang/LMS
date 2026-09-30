# LaTeX report

## Cau truc thu muc

- `main.tex`: file chinh, chi khai bao goi, dinh dang va thu tu include.
- `tex/frontmatter/`: loi cam on, tom tat, phan cong.
- `tex/chapters/`: noi dung chinh, danh so theo thu tu xuat hien trong bao cao.
- `tex/appendices/`: phu luc va tai nguyen bo sung.
- `images/`, `figures/`, `picture/`: tai nguyen hinh anh dang duoc tham chieu trong noi dung bao cao.
- `references.bib`: danh muc tai lieu tham khao BibTeX.
- `build/`: file phu sinh ra khi bien dich LaTeX.

## Quy uoc dat tenQ

- File nguon LaTeX dung tien to so thu tu 2 chu so: `01_introduction.tex`, `02_background.tex`.
- Ten file/folder dung `snake_case`, chu thuong, khong dau, de tranh loi duong dan tren LaTeX va Git.
- File phan dau bao cao nam trong `tex/frontmatter/`; chuong chinh nam trong `tex/chapters/`; phu luc nam trong `tex/appendices/`.

## Lenh build PDF

Chay tu thu muc `latex/`:

```sh
make
```

Lenh tren sinh file:

```text
HK252-DATN-330_2213188_2213214.pdf
```

Neu muon chay truc tiep khong qua `make`:

```sh
latexmk -pdf main.tex
```

Ten file mac dinh va thu muc build da duoc cau hinh trong `.latexmkrc`.

Don file phu:

```sh
make clean
```

Xoa ca file PDF da build:

```sh
make distclean
```



# 1. Để \includeSignedFormstrue, rồi build
make pdf
cp HK252-DATN-330_2213188.pdf HK252-DATN-330_2213188_with_forms.pdf

# 2. Đổi thành \includeSignedFormsfalse, rồi build lại
make pdf
cp HK252-DATN-330_2213188.pdf HK252-DATN-330_2213188_no_forms.pdf
  