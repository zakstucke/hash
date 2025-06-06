use serde::{Deserialize, Serialize};
use type_system::{
    knowledge::entity::id::EntityUuid,
    principal::{actor::ActorEntityUuid, actor_group::ActorGroupEntityUuid},
};

use crate::zanzibar::{
    Permission, Relation,
    types::{LeveledRelation, Relationship, RelationshipParts, Resource},
};

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AccountGroupNamespace {
    #[serde(rename = "graph/account_group")]
    AccountGroup,
}

impl Resource for ActorGroupEntityUuid {
    type Id = Self;
    type Kind = AccountGroupNamespace;

    #[expect(refining_impl_trait)]
    fn from_parts(kind: Self::Kind, id: Self::Id) -> Result<Self, !> {
        match kind {
            AccountGroupNamespace::AccountGroup => Ok(id),
        }
    }

    fn into_parts(self) -> (Self::Kind, Self::Id) {
        (AccountGroupNamespace::AccountGroup, self)
    }

    fn to_parts(&self) -> (Self::Kind, Self::Id) {
        Resource::into_parts(*self)
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AccountGroupResourceRelation {
    Administrator,
    Member,
}

impl Relation<ActorGroupEntityUuid> for AccountGroupResourceRelation {}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[serde(rename_all = "snake_case")]
pub enum AccountGroupPermission {
    AddMember,
    RemoveMember,
}

impl Permission<ActorGroupEntityUuid> for AccountGroupPermission {}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type", content = "id")]
pub enum AccountGroupSubject {
    Account(ActorEntityUuid),
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum AccountGroupSubjectNamespace {
    #[serde(rename = "graph/account")]
    Account,
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum AccountGroupSubjectId {
    Uuid(EntityUuid),
}

impl Resource for AccountGroupSubject {
    type Id = AccountGroupSubjectId;
    type Kind = AccountGroupSubjectNamespace;

    #[expect(refining_impl_trait)]
    fn from_parts(kind: Self::Kind, id: Self::Id) -> Result<Self, !> {
        Ok(match (kind, id) {
            (AccountGroupSubjectNamespace::Account, AccountGroupSubjectId::Uuid(uuid)) => {
                Self::Account(ActorEntityUuid::new(uuid))
            }
        })
    }

    fn into_parts(self) -> (Self::Kind, Self::Id) {
        match self {
            Self::Account(id) => (
                AccountGroupSubjectNamespace::Account,
                AccountGroupSubjectId::Uuid(id.into()),
            ),
        }
    }

    fn to_parts(&self) -> (Self::Kind, Self::Id) {
        Resource::into_parts(*self)
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[serde(rename_all = "camelCase", tag = "kind", deny_unknown_fields)]
pub enum AccountGroupAdministratorSubject {
    Account {
        #[serde(rename = "subjectId")]
        id: ActorEntityUuid,
    },
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[serde(rename_all = "camelCase", tag = "kind", deny_unknown_fields)]
pub enum AccountGroupMemberSubject {
    Account {
        #[serde(rename = "subjectId")]
        id: ActorEntityUuid,
    },
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[cfg_attr(feature = "utoipa", derive(utoipa::ToSchema))]
#[serde(rename_all = "camelCase", tag = "relation")]
pub enum AccountGroupRelationAndSubject {
    Administrator {
        subject: AccountGroupAdministratorSubject,
        #[serde(skip)]
        level: u8,
    },
    Member {
        subject: AccountGroupMemberSubject,
        #[serde(skip)]
        level: u8,
    },
}

impl Relationship for (ActorGroupEntityUuid, AccountGroupRelationAndSubject) {
    type Relation = AccountGroupResourceRelation;
    type Resource = ActorGroupEntityUuid;
    type Subject = AccountGroupSubject;
    type SubjectSet = !;

    #[expect(refining_impl_trait)]
    fn from_parts(parts: RelationshipParts<Self>) -> Result<Self, !> {
        Ok((
            parts.resource,
            match parts.relation.name {
                AccountGroupResourceRelation::Administrator => {
                    AccountGroupRelationAndSubject::Administrator {
                        subject: match (parts.subject, parts.subject_set) {
                            (AccountGroupSubject::Account(id), None) => {
                                AccountGroupAdministratorSubject::Account { id }
                            }
                        },
                        level: parts.relation.level,
                    }
                }
                AccountGroupResourceRelation::Member => AccountGroupRelationAndSubject::Member {
                    subject: match (parts.subject, parts.subject_set) {
                        (AccountGroupSubject::Account(id), None) => {
                            AccountGroupMemberSubject::Account { id }
                        }
                    },
                    level: parts.relation.level,
                },
            },
        ))
    }

    fn to_parts(&self) -> RelationshipParts<Self> {
        Self::into_parts(*self)
    }

    fn into_parts(self) -> RelationshipParts<Self> {
        let (relation, (subject, subject_set)) = match self.1 {
            AccountGroupRelationAndSubject::Administrator { subject, level } => (
                LeveledRelation {
                    name: AccountGroupResourceRelation::Administrator,
                    level,
                },
                match subject {
                    AccountGroupAdministratorSubject::Account { id } => {
                        (AccountGroupSubject::Account(id), None)
                    }
                },
            ),
            AccountGroupRelationAndSubject::Member { subject, level } => (
                LeveledRelation {
                    name: AccountGroupResourceRelation::Member,
                    level,
                },
                match subject {
                    AccountGroupMemberSubject::Account { id } => {
                        (AccountGroupSubject::Account(id), None)
                    }
                },
            ),
        };
        RelationshipParts {
            resource: self.0,
            relation,
            subject,
            subject_set,
        }
    }
}
