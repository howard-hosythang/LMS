lending/
│
├─── domain/
│    ├─── aggregates/
│    ├─── entities/
│    ├─── valueobjects/
│    ├─── services/
│    ├─── events/
│    └─── repositories/
│
├─── application/
│    ├─── usecases/
│    ├─── services/
│    ├─── dto/
│    ├─── commands/
│    └─── queries/
│
├─── infrastructure/
│    ├─── persistence/
│    │    ├─── jpa/
│    │    │    ├─── entities/
│    │    │    ├─── repositories/
│    │    │    └─── mappers/
│    │    │
│    │    └─── jooq/
│    │         ├─── repositories/
│    │         ├─── mappers/
│    │         └─── generated/
│    │
│    ├─── messaging/
│    ├─── adapters/
│    ├─── scheduling/
│    └─── config/
│
└─── presentation/
     └─── rest/
          ├─── controllers/
          ├─── dto/
          │    ├─── request/
          │    └─── response/
          ├─── mappers/
          └─── exception/