export type Metadata = {
  resourceStatus: "active" | "inactive";
  createdAt: string;
  createdBy: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
};
