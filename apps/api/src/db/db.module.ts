import { Global, Module } from "@nestjs/common";
import { databaseProvider } from "./db.provider";

@Global()
@Module({
  providers: [databaseProvider],
  exports: [databaseProvider],
})
export class DbModule {}
