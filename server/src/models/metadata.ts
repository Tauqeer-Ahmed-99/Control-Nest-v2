export type Metadata = {
  resourceStatus: "active" | "inactive";
  createdAt: Date;
  createdBy: string;
  modifiedAt: Date | null;
  modifiedBy: string | null;
};
