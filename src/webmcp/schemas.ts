export const emptyObjectSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
} as const;

export const branchIdSchema = {
  type: "object",
  properties: {
    branchId: { type: "string" },
  },
  required: ["branchId"],
  additionalProperties: false,
} as const;

export const createBranchSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 1, maxLength: 40 },
  },
  required: ["name"],
  additionalProperties: false,
} as const;

export const moveEntitySchema = {
  type: "object",
  properties: {
    branchId: { type: "string" },
    entityId: { type: "string" },
    position: {
      type: "object",
      properties: {
        x: { type: "number" },
        z: { type: "number" },
      },
      required: ["x", "z"],
      additionalProperties: false,
    },
  },
  required: ["branchId", "entityId", "position"],
  additionalProperties: false,
} as const;

export const modifyRouteSchema = {
  type: "object",
  properties: {
    branchId: { type: "string" },
    routeId: { type: "string" },
    enabled: { type: "boolean" },
    waypoints: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        properties: {
          x: { type: "number" },
          z: { type: "number" },
        },
        required: ["x", "z"],
        additionalProperties: false,
      },
    },
  },
  required: ["branchId", "routeId"],
  additionalProperties: false,
} as const;

export const TOOL_SCHEMAS = {
  inspect_world: emptyObjectSchema,
  inspect_constraints: emptyObjectSchema,
  inspect_branch: branchIdSchema,
  compare_branches: emptyObjectSchema,
  create_branch: createBranchSchema,
  move_entity: moveEntitySchema,
  modify_route: modifyRouteSchema,
  run_simulation: branchIdSchema,
  validate_branch: branchIdSchema,
  merge_verified_branch: branchIdSchema,
} as const;
