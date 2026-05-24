---
name: rfc-7644-scim-protocol
description: SCIM REST API protocol for identity provisioning operations
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rfc
  tags: [scim, rest, api, provisioning, multi-tenancy]
---

# RFC 7644 - SCIM Protocol

You are an expert in implementing SCIM Protocol as defined in RFC 7644. You create REST APIs for identity provisioning with filtering, pagination, and bulk operations.

## RFC Overview

| Property   | Value                                                 |
| ---------- | ----------------------------------------------------- |
| RFC Number | 7644                                                  |
| Title      | System for Cross-domain Identity Management: Protocol |
| Status     | Proposed Standard                                     |
| Published  | September 2015                                        |
| Requires   | RFC 7643 (Core Schema)                                |

## SCIM Endpoints

```text
┌─────────────────────────────────────────────────────────────────┐
│                      SCIM REST API                               │
│                                                                  │
│  Base URL: https://api.example.com/scim/v2                      │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Resource Endpoints                                         │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ GET    /Users                    List/Search users        │  │
│  │ POST   /Users                    Create user              │  │
│  │ GET    /Users/{id}               Get user                 │  │
│  │ PUT    /Users/{id}               Replace user             │  │
│  │ PATCH  /Users/{id}               Modify user              │  │
│  │ DELETE /Users/{id}               Delete user              │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ GET    /Groups                   List/Search groups       │  │
│  │ POST   /Groups                   Create group             │  │
│  │ GET    /Groups/{id}              Get group                │  │
│  │ PUT    /Groups/{id}              Replace group            │  │
│  │ PATCH  /Groups/{id}              Modify group             │  │
│  │ DELETE /Groups/{id}              Delete group             │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ Discovery & Operations                                     │  │
│  │ GET    /ServiceProviderConfig    Service capabilities     │  │
│  │ GET    /Schemas                  Schema definitions       │  │
│  │ GET    /ResourceTypes            Resource type info       │  │
│  │ POST   /Bulk                     Bulk operations          │  │
│  │ POST   /.search                  Cross-resource search    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation

### FastAPI SCIM Server

```python
from fastapi import FastAPI, Request, Response, HTTPException, Query, Depends
from fastapi.responses import JSONResponse
from typing import Optional, List
from pydantic import BaseModel
import re

app = FastAPI(title="SCIM 2.0 API")

SCIM_CONTENT_TYPE = "application/scim+json"

# Request/Response Models
class SCIMListResponse(BaseModel):
    """SCIM List Response (RFC 7644 Section 3.4.2)"""
    schemas: List[str] = ["urn:ietf:params:scim:api:messages:2.0:ListResponse"]
    totalResults: int
    startIndex: int = 1
    itemsPerPage: int
    Resources: List[dict]


class SCIMError(BaseModel):
    """SCIM Error Response (RFC 7644 Section 3.12)"""
    schemas: List[str] = ["urn:ietf:params:scim:api:messages:2.0:Error"]
    status: str
    scimType: Optional[str] = None
    detail: Optional[str] = None


class SCIMPatchOp(BaseModel):
    """SCIM Patch Operation (RFC 7644 Section 3.5.2)"""
    op: str  # "add", "remove", "replace"
    path: Optional[str] = None
    value: Optional[any] = None


class SCIMPatchRequest(BaseModel):
    """SCIM Patch Request"""
    schemas: List[str] = ["urn:ietf:params:scim:api:messages:2.0:PatchOp"]
    Operations: List[SCIMPatchOp]


# Dependency for tenant extraction
def get_tenant(request: Request) -> str:
    """Extract tenant from request."""
    # From header
    tenant = request.headers.get("X-Tenant-ID")
    if tenant:
        return tenant

    # From subdomain
    host = request.headers.get("host", "")
    if "." in host:
        return host.split(".")[0]

    raise HTTPException(400, detail="Tenant not specified")


# Initialize store
store = MultiTenantSCIMStore()


@app.post("/scim/v2/Users", response_class=JSONResponse)
async def create_user(
    request: Request,
    tenant_id: str = Depends(get_tenant),
):
    """
    Create User (RFC 7644 Section 3.3)

    Returns: 201 Created with Location header
    """
    data = await request.json()

    # Validate
    errors = SCIMValidator.validate_user(data)
    if errors:
        return scim_error_response(400, "invalidValue", "; ".join(errors))

    try:
        user = SCIMUser.from_dict(data)
        created = store.create_user(tenant_id, user)

        response = JSONResponse(
            content=created.to_dict(),
            status_code=201,
            media_type=SCIM_CONTENT_TYPE,
        )
        response.headers["Location"] = f"/scim/v2/Users/{created.id}"
        response.headers["ETag"] = created.meta.version

        return response

    except SCIMConflictError as e:
        return scim_error_response(409, "uniqueness", str(e))


@app.get("/scim/v2/Users/{user_id}", response_class=JSONResponse)
async def get_user(
    user_id: str,
    tenant_id: str = Depends(get_tenant),
):
    """
    Get User (RFC 7644 Section 3.4.1)
    """
    user = store.get_user(tenant_id, user_id)

    if not user:
        return scim_error_response(404, None, f"User {user_id} not found")

    response = JSONResponse(
        content=user.to_dict(),
        media_type=SCIM_CONTENT_TYPE,
    )
    response.headers["ETag"] = user.meta.version

    return response


@app.get("/scim/v2/Users", response_class=JSONResponse)
async def list_users(
    tenant_id: str = Depends(get_tenant),
    filter: Optional[str] = Query(None, description="SCIM filter expression"),
    sortBy: Optional[str] = Query(None),
    sortOrder: Optional[str] = Query("ascending"),
    startIndex: int = Query(1, ge=1),
    count: int = Query(100, ge=0, le=1000),
    attributes: Optional[str] = Query(None, description="Comma-separated attributes"),
    excludedAttributes: Optional[str] = Query(None),
):
    """
    List/Search Users (RFC 7644 Section 3.4.2)
    """
    users, total = store.list_users(
        tenant_id,
        filter_expr=filter,
        start_index=startIndex,
        count=count,
    )

    # Apply attribute filtering
    resources = [u.to_dict() for u in users]
    if attributes:
        attrs = set(attributes.split(","))
        resources = [filter_attributes(r, attrs) for r in resources]

    response = SCIMListResponse(
        totalResults=total,
        startIndex=startIndex,
        itemsPerPage=len(resources),
        Resources=resources,
    )

    return JSONResponse(
        content=response.dict(),
        media_type=SCIM_CONTENT_TYPE,
    )


@app.put("/scim/v2/Users/{user_id}", response_class=JSONResponse)
async def replace_user(
    user_id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant),
):
    """
    Replace User (RFC 7644 Section 3.5.1)
    """
    data = await request.json()

    # Validate If-Match for optimistic locking
    if_match = request.headers.get("If-Match")

    existing = store.get_user(tenant_id, user_id)
    if not existing:
        return scim_error_response(404, None, f"User {user_id} not found")

    if if_match and if_match != existing.meta.version:
        return scim_error_response(412, None, "Version mismatch")

    try:
        user = SCIMUser.from_dict(data)
        user.id = user_id  # Preserve ID
        updated = store.update_user(tenant_id, user)

        response = JSONResponse(
            content=updated.to_dict(),
            media_type=SCIM_CONTENT_TYPE,
        )
        response.headers["ETag"] = updated.meta.version

        return response

    except SCIMConflictError as e:
        return scim_error_response(409, "uniqueness", str(e))


@app.patch("/scim/v2/Users/{user_id}", response_class=JSONResponse)
async def patch_user(
    user_id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant),
):
    """
    Modify User (RFC 7644 Section 3.5.2)
    """
    data = await request.json()
    patch_request = SCIMPatchRequest(**data)

    existing = store.get_user(tenant_id, user_id)
    if not existing:
        return scim_error_response(404, None, f"User {user_id} not found")

    # Apply patch operations
    user_dict = existing.to_dict()

    for op in patch_request.Operations:
        user_dict = apply_patch_operation(user_dict, op)

    updated_user = SCIMUser.from_dict(user_dict)
    updated_user.id = user_id

    result = store.update_user(tenant_id, updated_user)

    return JSONResponse(
        content=result.to_dict(),
        media_type=SCIM_CONTENT_TYPE,
    )


@app.delete("/scim/v2/Users/{user_id}")
async def delete_user(
    user_id: str,
    tenant_id: str = Depends(get_tenant),
):
    """
    Delete User (RFC 7644 Section 3.6)

    Returns: 204 No Content
    """
    existing = store.get_user(tenant_id, user_id)
    if not existing:
        return scim_error_response(404, None, f"User {user_id} not found")

    store.delete_user(tenant_id, user_id)

    return Response(status_code=204)


def apply_patch_operation(resource: dict, op: SCIMPatchOp) -> dict:
    """
    Apply SCIM PATCH operation (RFC 7644 Section 3.5.2).
    """
    if op.op.lower() == "add":
        if op.path:
            # Path-based add
            set_path_value(resource, op.path, op.value, add=True)
        else:
            # Value is object to merge
            resource.update(op.value)

    elif op.op.lower() == "remove":
        if not op.path:
            raise ValueError("path required for remove")
        remove_path_value(resource, op.path)

    elif op.op.lower() == "replace":
        if op.path:
            set_path_value(resource, op.path, op.value)
        else:
            resource.update(op.value)

    return resource


def set_path_value(resource: dict, path: str, value: any, add: bool = False):
    """Set value at SCIM path."""
    # Parse path (simplified - production needs full SCIM path parser)
    # Handles: "displayName", "name.familyName", "emails[type eq \"work\"].value"

    if "." in path and "[" not in path:
        # Simple nested path
        parts = path.split(".")
        obj = resource
        for part in parts[:-1]:
            if part not in obj:
                obj[part] = {}
            obj = obj[part]
        obj[parts[-1]] = value

    elif "[" in path:
        # Filter path like emails[type eq "work"].value
        match = re.match(r'(\w+)\[(.+)\]\.?(\w+)?', path)
        if match:
            attr, filter_expr, sub_attr = match.groups()
            array = resource.get(attr, [])

            # Find matching element
            for item in array:
                if evaluate_filter(item, filter_expr):
                    if sub_attr:
                        item[sub_attr] = value
                    break
            else:
                # No match - add new element if 'add' operation
                if add:
                    new_item = {"value": value} if sub_attr == "value" else {sub_attr: value}
                    array.append(new_item)
                    resource[attr] = array
    else:
        resource[path] = value


def scim_error_response(status: int, scim_type: Optional[str], detail: str) -> JSONResponse:
    """Create SCIM error response."""
    error = SCIMError(
        status=str(status),
        scimType=scim_type,
        detail=detail,
    )
    return JSONResponse(
        content=error.dict(exclude_none=True),
        status_code=status,
        media_type=SCIM_CONTENT_TYPE,
    )
```

### Filtering (RFC 7644 Section 3.4.2.2)

```python
import re
from typing import Any, Callable
from dataclasses import dataclass
from enum import Enum

class FilterOperator(Enum):
    EQ = "eq"      # equals
    NE = "ne"      # not equals
    CO = "co"      # contains
    SW = "sw"      # starts with
    EW = "ew"      # ends with
    GT = "gt"      # greater than
    GE = "ge"      # greater than or equal
    LT = "lt"      # less than
    LE = "le"      # less than or equal
    PR = "pr"      # present (has value)


@dataclass
class FilterExpression:
    attribute: str
    operator: FilterOperator
    value: Any = None


class SCIMFilterParser:
    """Parse SCIM filter expressions (RFC 7644 Section 3.4.2.2)."""

    OPERATORS = {
        "eq": FilterOperator.EQ,
        "ne": FilterOperator.NE,
        "co": FilterOperator.CO,
        "sw": FilterOperator.SW,
        "ew": FilterOperator.EW,
        "gt": FilterOperator.GT,
        "ge": FilterOperator.GE,
        "lt": FilterOperator.LT,
        "le": FilterOperator.LE,
        "pr": FilterOperator.PR,
    }

    @classmethod
    def parse(cls, filter_string: str) -> Callable[[dict], bool]:
        """
        Parse filter string and return predicate function.

        Examples:
            userName eq "john"
            emails.value co "@example.com"
            name.familyName sw "J" and active eq true
            not (userName eq "admin")
        """
        # Handle logical operators
        if " and " in filter_string.lower():
            parts = re.split(r'\s+and\s+', filter_string, flags=re.IGNORECASE)
            predicates = [cls.parse(p.strip()) for p in parts]
            return lambda r: all(p(r) for p in predicates)

        if " or " in filter_string.lower():
            parts = re.split(r'\s+or\s+', filter_string, flags=re.IGNORECASE)
            predicates = [cls.parse(p.strip()) for p in parts]
            return lambda r: any(p(r) for p in predicates)

        if filter_string.lower().startswith("not "):
            inner = cls.parse(filter_string[4:].strip().strip("()"))
            return lambda r: not inner(r)

        # Parse single expression
        expr = cls._parse_expression(filter_string)
        return cls._create_predicate(expr)

    @classmethod
    def _parse_expression(cls, expr_string: str) -> FilterExpression:
        """Parse single filter expression."""
        # Handle "pr" (present) operator
        if expr_string.strip().endswith(" pr"):
            attr = expr_string.strip()[:-3].strip()
            return FilterExpression(attr, FilterOperator.PR)

        # Parse comparison: attr op value
        pattern = r'([\w.]+)\s+(eq|ne|co|sw|ew|gt|ge|lt|le)\s+(.+)'
        match = re.match(pattern, expr_string.strip(), re.IGNORECASE)

        if not match:
            raise ValueError(f"Invalid filter expression: {expr_string}")

        attr, op, value = match.groups()

        # Parse value
        value = value.strip()
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        elif value.lower() == "true":
            value = True
        elif value.lower() == "false":
            value = False
        elif value.isdigit():
            value = int(value)

        return FilterExpression(
            attribute=attr,
            operator=cls.OPERATORS[op.lower()],
            value=value,
        )

    @classmethod
    def _create_predicate(cls, expr: FilterExpression) -> Callable[[dict], bool]:
        """Create predicate function from expression."""

        def get_value(resource: dict, path: str) -> Any:
            """Get value at path, handling nested and multi-valued."""
            parts = path.split(".")

            current = resource
            for part in parts:
                if isinstance(current, dict):
                    current = current.get(part)
                elif isinstance(current, list):
                    # Multi-valued: return list of sub-values
                    return [item.get(part) for item in current if isinstance(item, dict)]
                else:
                    return None

            return current

        def predicate(resource: dict) -> bool:
            value = get_value(resource, expr.attribute)

            # Handle multi-valued attributes
            if isinstance(value, list):
                return any(cls._compare(v, expr.operator, expr.value) for v in value)

            return cls._compare(value, expr.operator, expr.value)

        return predicate

    @staticmethod
    def _compare(value: Any, operator: FilterOperator, compare_to: Any) -> bool:
        """Perform comparison operation."""
        if operator == FilterOperator.PR:
            return value is not None

        if value is None:
            return False

        # Case-insensitive string comparison
        if isinstance(value, str) and isinstance(compare_to, str):
            value = value.lower()
            compare_to = compare_to.lower()

        comparisons = {
            FilterOperator.EQ: lambda: value == compare_to,
            FilterOperator.NE: lambda: value != compare_to,
            FilterOperator.CO: lambda: compare_to in str(value),
            FilterOperator.SW: lambda: str(value).startswith(str(compare_to)),
            FilterOperator.EW: lambda: str(value).endswith(str(compare_to)),
            FilterOperator.GT: lambda: value > compare_to,
            FilterOperator.GE: lambda: value >= compare_to,
            FilterOperator.LT: lambda: value < compare_to,
            FilterOperator.LE: lambda: value <= compare_to,
        }

        return comparisons.get(operator, lambda: False)()
```

### Bulk Operations (RFC 7644 Section 3.7)

```python
@dataclass
class BulkOperation:
    method: str  # POST, PUT, PATCH, DELETE
    path: str
    bulkId: Optional[str] = None
    data: Optional[dict] = None


@dataclass
class BulkResponse:
    method: str
    bulkId: Optional[str]
    location: Optional[str]
    status: str
    response: Optional[dict] = None


@app.post("/scim/v2/Bulk")
async def bulk_operations(
    request: Request,
    tenant_id: str = Depends(get_tenant),
):
    """
    Bulk Operations (RFC 7644 Section 3.7)
    """
    data = await request.json()

    operations = data.get("Operations", [])
    fail_on_errors = data.get("failOnErrors", len(operations))

    results = []
    error_count = 0
    bulkid_to_id = {}  # Map bulkId to created resource ID

    for op in operations:
        if error_count >= fail_on_errors:
            break

        try:
            result = await process_bulk_operation(
                tenant_id,
                BulkOperation(
                    method=op["method"],
                    path=op["path"],
                    bulkId=op.get("bulkId"),
                    data=op.get("data"),
                ),
                bulkid_to_id,
            )
            results.append(result)

            # Track bulkId mapping for cross-references
            if result.bulkId and result.location:
                resource_id = result.location.split("/")[-1]
                bulkid_to_id[f"bulkId:{result.bulkId}"] = resource_id

        except Exception as e:
            error_count += 1
            results.append(BulkResponse(
                method=op["method"],
                bulkId=op.get("bulkId"),
                location=None,
                status="400",
                response={"error": str(e)},
            ))

    return JSONResponse(
        content={
            "schemas": ["urn:ietf:params:scim:api:messages:2.0:BulkResponse"],
            "Operations": [r.__dict__ for r in results],
        },
        media_type=SCIM_CONTENT_TYPE,
    )


async def process_bulk_operation(
    tenant_id: str,
    op: BulkOperation,
    bulkid_map: dict,
) -> BulkResponse:
    """Process single bulk operation."""

    # Resolve bulkId references in data
    if op.data:
        op.data = resolve_bulk_references(op.data, bulkid_map)

    if op.method == "POST":
        if op.path == "/Users":
            user = SCIMUser.from_dict(op.data)
            created = store.create_user(tenant_id, user)
            return BulkResponse(
                method="POST",
                bulkId=op.bulkId,
                location=f"/scim/v2/Users/{created.id}",
                status="201",
            )

    elif op.method == "DELETE":
        # Extract ID from path
        match = re.match(r'/(\w+)/(.+)', op.path)
        if match:
            resource_type, resource_id = match.groups()
            if resource_type == "Users":
                store.delete_user(tenant_id, resource_id)
                return BulkResponse(
                    method="DELETE",
                    bulkId=op.bulkId,
                    location=None,
                    status="204",
                )

    raise ValueError(f"Unsupported operation: {op.method} {op.path}")


def resolve_bulk_references(data: dict, bulkid_map: dict) -> dict:
    """Resolve bulkId:xxx references to actual IDs."""
    import json

    json_str = json.dumps(data)
    for ref, actual_id in bulkid_map.items():
        json_str = json_str.replace(ref, actual_id)

    return json.loads(json_str)
```

### Service Provider Configuration

```python
@app.get("/scim/v2/ServiceProviderConfig")
async def service_provider_config():
    """
    Service Provider Configuration (RFC 7644 Section 4)
    """
    return JSONResponse(
        content={
            "schemas": ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
            "documentationUri": "https://docs.example.com/scim",
            "patch": {"supported": True},
            "bulk": {
                "supported": True,
                "maxOperations": 1000,
                "maxPayloadSize": 1048576,
            },
            "filter": {
                "supported": True,
                "maxResults": 1000,
            },
            "changePassword": {"supported": False},
            "sort": {"supported": True},
            "etag": {"supported": True},
            "authenticationSchemes": [
                {
                    "type": "oauthbearertoken",
                    "name": "OAuth 2.0 Bearer Token",
                    "description": "Authentication using OAuth 2.0 Bearer Tokens",
                    "specUri": "https://tools.ietf.org/html/rfc6750",
                }
            ],
        },
        media_type=SCIM_CONTENT_TYPE,
    )
```

## Multi-Tenancy

All operations automatically scope to tenant via the `get_tenant` dependency. Cross-tenant access is prevented at the store level.

## Related RFCs

| RFC      | Title            | Relationship     |
| -------- | ---------------- | ---------------- |
| RFC 7643 | SCIM Core Schema | Resource schemas |
| RFC 7642 | SCIM Definitions | Concepts         |

## Output Format

Provide:

- REST API implementations
- Filter parsing and evaluation
- Bulk operation handling
- Tenant isolation patterns
