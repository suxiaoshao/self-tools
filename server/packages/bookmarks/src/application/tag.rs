use super::NovelSite;

use diesel::PgConnection;

use crate::{application::repository::tag::TagModel, errors::AppResult};

#[derive(Eq, PartialEq)]
pub(crate) struct Tag {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) site: NovelSite,
    pub(crate) site_id: String,
    pub(crate) create_time: time::OffsetDateTime,
    pub(crate) update_time: time::OffsetDateTime,
}

impl From<TagModel> for Tag {
    fn from(value: TagModel) -> Self {
        Self {
            id: value.id,
            name: value.name,
            site: value.site.into(),
            site_id: value.site_id,
            create_time: value.create_time,
            update_time: value.update_time,
        }
    }
}

/// id 相关
impl Tag {
    /// 创建标签
    pub(super) fn create(
        name: &str,
        site: NovelSite,
        site_id: &str,
        conn: &mut PgConnection,
    ) -> AppResult<Self> {
        let name = normalized_name(name)?;
        super::write(conn, |conn| {
            Ok(TagModel::create(name, site.into(), site_id, conn)?.into())
        })
        .map_err(crate::errors::source_conflict)
    }
    /// 删除标签
    pub(super) fn delete(id: i64, conn: &mut PgConnection) -> AppResult<i64> {
        crate::errors::validate_id(id, "id")?;
        super::write(conn, |conn| {
            if TagModel::exists(id, conn)? {
                use diesel::RunQueryDsl;
                // Tags are stored in an array without an FK; maintain the relation on deletion.
                diesel::sql_query("UPDATE novel SET tags=array_remove(tags,$1) WHERE $1=ANY(tags)")
                    .bind::<diesel::sql_types::BigInt, _>(id)
                    .execute(conn)?;
                TagModel::delete(id, conn)?;
            }
            Ok(id)
        })
    }
}

/// all
impl Tag {
    /// 获取所有标签
    pub(super) fn all(conn: &mut PgConnection) -> AppResult<Vec<Self>> {
        let tags = TagModel::get_list(conn)?;
        Ok(tags.into_iter().map(|x| x.into()).collect())
    }
}

/// Manual tag names may be a single character; only surrounding whitespace is removed.
fn normalized_name(name: &str) -> AppResult<&str> {
    let name = name.trim();
    if name.is_empty() {
        return Err(crate::errors::invalid(
            "name",
            service_errors::ValidationCode::Required,
        ));
    }
    if name.chars().count() > 20 {
        return Err(service_errors::UseCaseError::Rejected(
            crate::errors::Rejection::Validation(vec![service_errors::FieldViolation {
                path: vec!["name".into()],
                code: service_errors::ValidationCode::TooLong,
                min: None,
                max: Some(20),
            }]),
        ));
    }
    Ok(name)
}

#[cfg(test)]
mod tests {
    use super::normalized_name;
    use crate::errors::Rejection;
    use service_errors::{UseCaseError, ValidationCode};

    #[test]
    fn tag_name_requires_content_and_preserves_single_character_tags() {
        for name in ["", " ", "\t\n\u{3000}\u{a0}"] {
            let Err(UseCaseError::Rejected(Rejection::Validation(issues))) = normalized_name(name)
            else {
                panic!("blank tag must be a validation rejection");
            };
            assert_eq!(issues.len(), 1);
            assert_eq!(issues[0].path, ["name"]);
            assert_eq!(issues[0].code, ValidationCode::Required);
        }
        for name in ["甜", "虐", "燃", "a", "🔥"] {
            assert_eq!(normalized_name(name).unwrap(), name);
        }
        assert_eq!(normalized_name(" \t甜\u{3000}").unwrap(), "甜");
        assert_eq!(normalized_name("  slow burn  ").unwrap(), "slow burn");
    }

    #[test]
    fn tag_name_limit_counts_characters_after_trimming() {
        let limit = "🔥".repeat(20);
        assert_eq!(normalized_name(&format!(" {limit} ")).unwrap(), limit);
        let Err(UseCaseError::Rejected(Rejection::Validation(issues))) =
            normalized_name(&"🔥".repeat(21))
        else {
            panic!("long tag must be a validation rejection");
        };
        assert_eq!(issues[0].path, ["name"]);
        assert_eq!(issues[0].code, ValidationCode::TooLong);
        assert_eq!(issues[0].max, Some(20));
    }
}
