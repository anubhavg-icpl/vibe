---
name: rfc-7643-scim-schema
description: System for Cross-domain Identity Management schema definitions for user provisioning. Use when implementing or validating rfc 7643 scim schema protocol compliance.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rfc
  tags: [scim, identity, provisioning, schema, multi-tenancy]
---

# RFC 7643 - SCIM Core Schema

You are an expert in implementing SCIM Core Schema as defined in RFC 7643. You create standards-compliant identity resources for user and group provisioning with multi-tenancy support.

## RFC Overview

| Property   | Value                                                    |
| ---------- | -------------------------------------------------------- |
| RFC Number | 7643                                                     |
| Title      | System for Cross-domain Identity Management: Core Schema |
| Status     | Proposed Standard                                        |
| Published  | September 2015                                           |
| Related    | RFC 7642 (Definitions), RFC 7644 (Protocol)              |

## SCIM Resource Model

```text
┌─────────────────────────────────────────────────────────────────┐
│                      SCIM Resources                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Common Attributes                       │   │
│  │  id, externalId, meta                                    │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                      │
│           ┌───────────────┼───────────────┐                     │
│           │               │               │                      │
│  ┌────────▼─────┐ ┌───────▼──────┐ ┌─────▼───────┐            │
│  │    User      │ │    Group     │ │  Enterprise │            │
│  │   Resource   │ │   Resource   │ │  Extension  │            │
│  │              │ │              │ │             │            │
│  │ userName     │ │ displayName  │ │ employeeNum │            │
│  │ name         │ │ members[]    │ │ department  │            │
│  │ emails[]     │ │              │ │ manager     │            │
│  │ phoneNumbers │ │              │ │ division    │            │
│  │ addresses[]  │ │              │ │             │            │
│  └──────────────┘ └──────────────┘ └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Core Schema Implementation

### User Resource

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Any
from enum import Enum
import json
import re
import uuid

# SCIM Schema URNs
SCIM_USER_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:User"
SCIM_ENTERPRISE_SCHEMA = "urn:ietf:params:scim:schemas:extension:enterprise:2.0:User"
SCIM_GROUP_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:Group"


@dataclass
class SCIMName:
    """RFC 7643 Section 4.1.1: Name"""
    formatted: Optional[str] = None
    familyName: Optional[str] = None
    givenName: Optional[str] = None
    middleName: Optional[str] = None
    honorificPrefix: Optional[str] = None
    honorificSuffix: Optional[str] = None


@dataclass
class SCIMMultiValue:
    """Base for multi-valued attributes (RFC 7643 Section 2.4)"""
    value: str
    type: Optional[str] = None  # e.g., "work", "home"
    primary: bool = False
    display: Optional[str] = None

    def to_dict(self) -> dict:
        d = {"value": self.value}
        if self.type:
            d["type"] = self.type
        if self.primary:
            d["primary"] = True
        if self.display:
            d["display"] = self.display
        return d


@dataclass
class SCIMEmail(SCIMMultiValue):
    """Email address (RFC 7643 Section 4.1.2)"""
    pass


@dataclass
class SCIMPhoneNumber(SCIMMultiValue):
    """Phone number (RFC 7643 Section 4.1.2)"""
    pass


@dataclass
class SCIMAddress:
    """Physical address (RFC 7643 Section 4.1.2)"""
    formatted: Optional[str] = None
    streetAddress: Optional[str] = None
    locality: Optional[str] = None
    region: Optional[str] = None
    postalCode: Optional[str] = None
    country: Optional[str] = None
    type: Optional[str] = None  # "work", "home", etc.
    primary: bool = False


@dataclass
class SCIMMeta:
    """Resource metadata (RFC 7643 Section 3.1)"""
    resourceType: str
    created: datetime
    lastModified: datetime
    location: Optional[str] = None
    version: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "resourceType": self.resourceType,
            "created": self.created.isoformat() + "Z",
            "lastModified": self.lastModified.isoformat() + "Z",
            "location": self.location,
            "version": self.version,
        }


@dataclass
class SCIMEnterpriseUser:
    """Enterprise User Extension (RFC 7643 Section 4.3)"""
    employeeNumber: Optional[str] = None
    costCenter: Optional[str] = None
    organization: Optional[str] = None
    division: Optional[str] = None
    department: Optional[str] = None
    manager: Optional[dict] = None  # {"value": "id", "$ref": "uri", "displayName": "name"}


@dataclass
class SCIMUser:
    """SCIM User Resource (RFC 7643 Section 4.1)"""
    # Required
    userName: str

    # Common attributes
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    externalId: Optional[str] = None
    meta: Optional[SCIMMeta] = None

    # Name
    name: Optional[SCIMName] = None
    displayName: Optional[str] = None
    nickName: Optional[str] = None
    profileUrl: Optional[str] = None
    title: Optional[str] = None
    userType: Optional[str] = None
    preferredLanguage: Optional[str] = None
    locale: Optional[str] = None
    timezone: Optional[str] = None
    active: bool = True

    # Multi-valued
    emails: List[SCIMEmail] = field(default_factory=list)
    phoneNumbers: List[SCIMPhoneNumber] = field(default_factory=list)
    addresses: List[SCIMAddress] = field(default_factory=list)
    groups: List[dict] = field(default_factory=list)  # Read-only
    roles: List[SCIMMultiValue] = field(default_factory=list)
    entitlements: List[SCIMMultiValue] = field(default_factory=list)

    # Enterprise extension
    enterprise: Optional[SCIMEnterpriseUser] = None

    # Multi-tenancy
    tenant_id: Optional[str] = None

    def to_dict(self) -> dict:
        """Serialize to SCIM JSON representation."""
        schemas = [SCIM_USER_SCHEMA]

        d = {
            "schemas": schemas,
            "id": self.id,
            "userName": self.userName,
            "active": self.active,
        }

        if self.externalId:
            d["externalId"] = self.externalId

        if self.meta:
            d["meta"] = self.meta.to_dict()

        if self.name:
            d["name"] = {
                k: v for k, v in {
                    "formatted": self.name.formatted,
                    "familyName": self.name.familyName,
                    "givenName": self.name.givenName,
                    "middleName": self.name.middleName,
                    "honorificPrefix": self.name.honorificPrefix,
                    "honorificSuffix": self.name.honorificSuffix,
                }.items() if v
            }

        for attr in ["displayName", "nickName", "profileUrl", "title",
                     "userType", "preferredLanguage", "locale", "timezone"]:
            value = getattr(self, attr)
            if value:
                d[attr] = value

        if self.emails:
            d["emails"] = [e.to_dict() for e in self.emails]

        if self.phoneNumbers:
            d["phoneNumbers"] = [p.to_dict() for p in self.phoneNumbers]

        if self.addresses:
            d["addresses"] = [
                {k: v for k, v in {
                    "formatted": a.formatted,
                    "streetAddress": a.streetAddress,
                    "locality": a.locality,
                    "region": a.region,
                    "postalCode": a.postalCode,
                    "country": a.country,
                    "type": a.type,
                    "primary": a.primary if a.primary else None,
                }.items() if v}
                for a in self.addresses
            ]

        if self.groups:
            d["groups"] = self.groups

        if self.enterprise:
            schemas.append(SCIM_ENTERPRISE_SCHEMA)
            d[SCIM_ENTERPRISE_SCHEMA] = {
                k: v for k, v in {
                    "employeeNumber": self.enterprise.employeeNumber,
                    "costCenter": self.enterprise.costCenter,
                    "organization": self.enterprise.organization,
                    "division": self.enterprise.division,
                    "department": self.enterprise.department,
                    "manager": self.enterprise.manager,
                }.items() if v
            }

        return d

    @classmethod
    def from_dict(cls, data: dict) -> "SCIMUser":
        """Deserialize from SCIM JSON."""
        user = cls(
            id=data.get("id", str(uuid.uuid4())),
            externalId=data.get("externalId"),
            userName=data["userName"],
            displayName=data.get("displayName"),
            nickName=data.get("nickName"),
            profileUrl=data.get("profileUrl"),
            title=data.get("title"),
            userType=data.get("userType"),
            preferredLanguage=data.get("preferredLanguage"),
            locale=data.get("locale"),
            timezone=data.get("timezone"),
            active=data.get("active", True),
        )

        # Parse name
        if "name" in data:
            user.name = SCIMName(**data["name"])

        # Parse emails
        user.emails = [
            SCIMEmail(
                value=e["value"],
                type=e.get("type"),
                primary=e.get("primary", False),
                display=e.get("display"),
            )
            for e in data.get("emails", [])
        ]

        # Parse phone numbers
        user.phoneNumbers = [
            SCIMPhoneNumber(
                value=p["value"],
                type=p.get("type"),
                primary=p.get("primary", False),
            )
            for p in data.get("phoneNumbers", [])
        ]

        # Parse addresses
        user.addresses = [
            SCIMAddress(**a)
            for a in data.get("addresses", [])
        ]

        # Parse enterprise extension
        if SCIM_ENTERPRISE_SCHEMA in data:
            ext = data[SCIM_ENTERPRISE_SCHEMA]
            user.enterprise = SCIMEnterpriseUser(
                employeeNumber=ext.get("employeeNumber"),
                costCenter=ext.get("costCenter"),
                organization=ext.get("organization"),
                division=ext.get("division"),
                department=ext.get("department"),
                manager=ext.get("manager"),
            )

        return user
```

### Group Resource

```python
@dataclass
class SCIMGroupMember:
    """Group member reference (RFC 7643 Section 4.2)"""
    value: str  # Member ID
    ref: Optional[str] = None  # $ref URI
    display: Optional[str] = None
    type: Optional[str] = None  # "User" or "Group"

    def to_dict(self) -> dict:
        d = {"value": self.value}
        if self.ref:
            d["$ref"] = self.ref
        if self.display:
            d["display"] = self.display
        if self.type:
            d["type"] = self.type
        return d


@dataclass
class SCIMGroup:
    """SCIM Group Resource (RFC 7643 Section 4.2)"""
    displayName: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    externalId: Optional[str] = None
    meta: Optional[SCIMMeta] = None
    members: List[SCIMGroupMember] = field(default_factory=list)

    # Multi-tenancy
    tenant_id: Optional[str] = None

    def to_dict(self) -> dict:
        d = {
            "schemas": [SCIM_GROUP_SCHEMA],
            "id": self.id,
            "displayName": self.displayName,
        }

        if self.externalId:
            d["externalId"] = self.externalId

        if self.meta:
            d["meta"] = self.meta.to_dict()

        if self.members:
            d["members"] = [m.to_dict() for m in self.members]

        return d

    @classmethod
    def from_dict(cls, data: dict) -> "SCIMGroup":
        group = cls(
            id=data.get("id", str(uuid.uuid4())),
            externalId=data.get("externalId"),
            displayName=data["displayName"],
        )

        group.members = [
            SCIMGroupMember(
                value=m["value"],
                ref=m.get("$ref"),
                display=m.get("display"),
                type=m.get("type"),
            )
            for m in data.get("members", [])
        ]

        return group
```

### Schema Discovery

```python
@dataclass
class SCIMSchemaAttribute:
    """SCIM Schema Attribute definition (RFC 7643 Section 7)"""
    name: str
    type: str  # "string", "boolean", "decimal", "integer", "dateTime", "reference", "complex"
    multiValued: bool = False
    description: Optional[str] = None
    required: bool = False
    canonicalValues: Optional[List[str]] = None
    caseExact: bool = False
    mutability: str = "readWrite"  # "readOnly", "readWrite", "immutable", "writeOnly"
    returned: str = "default"  # "always", "never", "default", "request"
    uniqueness: str = "none"  # "none", "server", "global"
    referenceTypes: Optional[List[str]] = None
    subAttributes: Optional[List["SCIMSchemaAttribute"]] = None


class SCIMSchemaDefinition:
    """SCIM Schema definitions for discovery endpoint."""

    @staticmethod
    def user_schema() -> dict:
        """Return User schema definition."""
        return {
            "id": SCIM_USER_SCHEMA,
            "name": "User",
            "description": "User Account",
            "attributes": [
                {
                    "name": "userName",
                    "type": "string",
                    "multiValued": False,
                    "required": True,
                    "caseExact": False,
                    "mutability": "readWrite",
                    "returned": "default",
                    "uniqueness": "server",
                },
                {
                    "name": "name",
                    "type": "complex",
                    "multiValued": False,
                    "required": False,
                    "subAttributes": [
                        {"name": "formatted", "type": "string"},
                        {"name": "familyName", "type": "string"},
                        {"name": "givenName", "type": "string"},
                        {"name": "middleName", "type": "string"},
                        {"name": "honorificPrefix", "type": "string"},
                        {"name": "honorificSuffix", "type": "string"},
                    ],
                },
                {
                    "name": "emails",
                    "type": "complex",
                    "multiValued": True,
                    "required": False,
                    "subAttributes": [
                        {"name": "value", "type": "string"},
                        {"name": "type", "type": "string", "canonicalValues": ["work", "home", "other"]},
                        {"name": "primary", "type": "boolean"},
                    ],
                },
                {
                    "name": "active",
                    "type": "boolean",
                    "multiValued": False,
                    "required": False,
                    "mutability": "readWrite",
                    "returned": "default",
                },
            ],
            "meta": {
                "resourceType": "Schema",
                "location": "/v2/Schemas/" + SCIM_USER_SCHEMA,
            },
        }
```

## Multi-Tenancy Patterns

### Tenant-Scoped SCIM Resources

```python
class MultiTenantSCIMStore:
    """SCIM resource store with tenant isolation."""

    def __init__(self):
        self.users: dict[str, dict[str, SCIMUser]] = {}  # tenant_id -> user_id -> user
        self.groups: dict[str, dict[str, SCIMGroup]] = {}

    def _ensure_tenant(self, tenant_id: str):
        if tenant_id not in self.users:
            self.users[tenant_id] = {}
        if tenant_id not in self.groups:
            self.groups[tenant_id] = {}

    def create_user(self, tenant_id: str, user: SCIMUser) -> SCIMUser:
        """Create user in tenant scope."""
        self._ensure_tenant(tenant_id)

        # Check username uniqueness within tenant
        for existing in self.users[tenant_id].values():
            if existing.userName.lower() == user.userName.lower():
                raise SCIMConflictError("userName already exists")

        user.tenant_id = tenant_id
        user.meta = SCIMMeta(
            resourceType="User",
            created=datetime.utcnow(),
            lastModified=datetime.utcnow(),
            location=f"/scim/v2/Users/{user.id}",
            version=f'W/"{uuid.uuid4()}"',
        )

        self.users[tenant_id][user.id] = user
        return user

    def get_user(self, tenant_id: str, user_id: str) -> Optional[SCIMUser]:
        """Get user with tenant isolation."""
        self._ensure_tenant(tenant_id)
        user = self.users[tenant_id].get(user_id)

        # Extra validation
        if user and user.tenant_id != tenant_id:
            return None  # Cross-tenant access denied

        return user

    def list_users(
        self,
        tenant_id: str,
        filter_expr: Optional[str] = None,
        start_index: int = 1,
        count: int = 100,
    ) -> tuple[List[SCIMUser], int]:
        """List users with filtering and pagination."""
        self._ensure_tenant(tenant_id)

        users = list(self.users[tenant_id].values())

        # Apply filter
        if filter_expr:
            users = self._apply_filter(users, filter_expr)

        total = len(users)

        # Apply pagination
        start = start_index - 1  # SCIM is 1-indexed
        users = users[start:start + count]

        return users, total

    def _apply_filter(self, users: List[SCIMUser], filter_expr: str) -> List[SCIMUser]:
        """Apply SCIM filter expression (RFC 7644 Section 3.4.2.2)."""
        # Simple filter parsing - production would use proper parser
        if filter_expr.startswith("userName eq "):
            value = filter_expr.split('"')[1]
            return [u for u in users if u.userName == value]
        elif filter_expr.startswith("emails.value eq "):
            value = filter_expr.split('"')[1]
            return [u for u in users if any(e.value == value for e in u.emails)]
        return users


class SCIMConflictError(Exception):
    """SCIM uniqueness conflict."""
    pass
```

## Validation

```python
class SCIMValidator:
    """Validate SCIM resources against schema."""

    @staticmethod
    def validate_user(data: dict) -> List[str]:
        """Validate user resource data."""
        errors = []

        # Required attribute
        if "userName" not in data:
            errors.append("userName is required")

        # Validate schemas
        schemas = data.get("schemas", [])
        if SCIM_USER_SCHEMA not in schemas:
            errors.append(f"Missing required schema: {SCIM_USER_SCHEMA}")

        # Validate emails format
        for i, email in enumerate(data.get("emails", [])):
            if "value" not in email:
                errors.append(f"emails[{i}].value is required")
            elif not re.match(r"[^@]+@[^@]+\.[^@]+", email["value"]):
                errors.append(f"emails[{i}].value is not a valid email")

        # Validate single primary
        primary_emails = [e for e in data.get("emails", []) if e.get("primary")]
        if len(primary_emails) > 1:
            errors.append("Only one email can be primary")

        return errors
```

## Related RFCs

| RFC      | Title            | Relationship              |
| -------- | ---------------- | ------------------------- |
| RFC 7642 | SCIM Definitions | Concepts and requirements |
| RFC 7644 | SCIM Protocol    | HTTP operations           |

## Output Format

Provide:

- SCIM resource implementations
- Schema definitions
- Multi-tenant isolation patterns
- Validation logic
