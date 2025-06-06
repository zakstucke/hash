use serde::{Deserialize, Serialize};
use type_system::principal::actor::ActorEntityUuid;

use crate::zanzibar::types::{Resource, Subject};

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AccountNamespace {
    #[serde(rename = "graph/account")]
    Account,
}

impl Resource for ActorEntityUuid {
    type Id = Self;
    type Kind = AccountNamespace;

    #[expect(refining_impl_trait)]
    fn from_parts(kind: Self::Kind, id: Self::Id) -> Result<Self, !> {
        match kind {
            AccountNamespace::Account => Ok(id),
        }
    }

    fn into_parts(self) -> (Self::Kind, Self::Id) {
        (AccountNamespace::Account, self)
    }

    fn to_parts(&self) -> (Self::Kind, Self::Id) {
        Resource::into_parts(*self)
    }
}

impl Subject for ActorEntityUuid {
    type Relation = !;
    type Resource = Self;

    #[expect(refining_impl_trait)]
    fn from_parts(resource: Self::Resource, _relation: Option<!>) -> Result<Self, !> {
        Ok(resource)
    }

    fn into_parts(self) -> (Self::Resource, Option<Self::Relation>) {
        (self, None)
    }

    fn to_parts(&self) -> (Self::Resource, Option<Self::Relation>) {
        Subject::into_parts(*self)
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PublicAccess {
    #[serde(rename = "*")]
    Public,
}

impl Resource for PublicAccess {
    type Id = Self;
    type Kind = AccountNamespace;

    #[expect(refining_impl_trait)]
    fn from_parts(kind: Self::Kind, id: Self::Id) -> Result<Self, !> {
        match kind {
            AccountNamespace::Account => Ok(id),
        }
    }

    fn into_parts(self) -> (Self::Kind, Self::Id) {
        (AccountNamespace::Account, self)
    }

    fn to_parts(&self) -> (Self::Kind, Self::Id) {
        Resource::into_parts(*self)
    }
}

impl Subject for PublicAccess {
    type Relation = !;
    type Resource = Self;

    #[expect(refining_impl_trait)]
    fn from_parts(resource: Self::Resource, _relation: Option<!>) -> Result<Self, !> {
        Ok(resource)
    }

    fn into_parts(self) -> (Self::Resource, Option<Self::Relation>) {
        (self, None)
    }

    fn to_parts(&self) -> (Self::Resource, Option<Self::Relation>) {
        Subject::into_parts(*self)
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ActorIdOrPublic {
    ActorId(ActorEntityUuid),
    PublicAccess(PublicAccess),
}

impl Resource for ActorIdOrPublic {
    type Id = Self;
    type Kind = AccountNamespace;

    #[expect(refining_impl_trait)]
    fn from_parts(kind: Self::Kind, id: Self::Id) -> Result<Self, !> {
        match kind {
            AccountNamespace::Account => Ok(id),
        }
    }

    fn into_parts(self) -> (Self::Kind, Self::Id) {
        (AccountNamespace::Account, self)
    }

    fn to_parts(&self) -> (Self::Kind, Self::Id) {
        Resource::into_parts(*self)
    }
}

impl Subject for ActorIdOrPublic {
    type Relation = !;
    type Resource = Self;

    #[expect(refining_impl_trait)]
    fn from_parts(resource: Self::Resource, _relation: Option<!>) -> Result<Self, !> {
        Ok(resource)
    }

    fn into_parts(self) -> (Self::Resource, Option<Self::Relation>) {
        (self, None)
    }

    fn to_parts(&self) -> (Self::Resource, Option<Self::Relation>) {
        Subject::into_parts(*self)
    }
}
