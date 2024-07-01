import { model, Schema } from "mongoose";

const MigrationSchema = new Schema({
  // Create an autoincrement field
  migration_version: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, required: true, default: Date.now },
  command: { type: String, required: true },
});

export default MigrationSchema;
