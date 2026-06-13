use async_graphql::{InputValueError, InputValueResult, Scalar, ScalarType, Value};
use time::{OffsetDateTime, format_description::well_known::Rfc3339};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct DateTime(pub OffsetDateTime);

impl From<OffsetDateTime> for DateTime {
    fn from(value: OffsetDateTime) -> Self {
        Self(value)
    }
}

impl From<DateTime> for OffsetDateTime {
    fn from(value: DateTime) -> Self {
        value.0
    }
}

#[Scalar(name = "DateTime")]
impl ScalarType for DateTime {
    fn parse(value: Value) -> InputValueResult<Self> {
        if let Value::String(value) = value {
            return OffsetDateTime::parse(&value, &Rfc3339)
                .map(Self)
                .map_err(|error| InputValueError::custom(format!("invalid DateTime: {error}")));
        }

        Err(InputValueError::expected_type(value))
    }

    fn to_value(&self) -> Value {
        Value::String(
            self.0
                .format(&Rfc3339)
                .expect("OffsetDateTime should always format as RFC 3339"),
        )
    }
}
