# Diagram

Thư mục này chứa các sơ đồ PlantUML dùng cho báo cáo.

- `classdiagram/classdiagram.puml`: class diagram tổng quát của hệ thống.
- `architecture/system_architecture_overview.puml`: sơ đồ kiến trúc tổng thể hiện tại của hệ thống.
- `usecase/overview.puml`: use case diagram tổng quát.
- `usecase/modules/`: các use case diagram nhỏ theo từng nhóm chức năng.

Gợi ý render nếu đã cài PlantUML:

```bash
plantuml diagram/architecture/system_architecture_overview.puml
plantuml diagram/classdiagram/classdiagram.puml
plantuml diagram/usecase/overview.puml
plantuml 'diagram/usecase/modules/*.puml'
```
