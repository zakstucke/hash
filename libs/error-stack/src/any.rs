#![expect(deprecated, reason = "We use `Context` to maintain compatibility")]
use core::{
    fmt::{self, Debug, Display},
    ops::{Deref, DerefMut},
    panic::Location,
};

use crate::{Context, IntoReport, Report};

/// A special concrete wrapping type acting as `Report<dyn Error + Send + Sync>`
/// which can be used as a catch-all error type when no custom error type is needed.
///
/// This type is benefical because it implements `From<E: Into<Report<E>>`,
/// meaning any error implementing [`core::error::Error`], or is a `Report<E>` can be
/// propagated automatically with `?` without requiring `.change_context(AnyError)`.
///
/// This type implements all the same methods the underlying `Report<dyn Error + Send + Sync>`
/// implements.
#[must_use]
pub struct AnyReport(Report<dyn Context + Send + Sync + 'static>);

impl Display for AnyReport {
    fn fmt(&self, formatter: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(formatter, "{}", self.0)
    }
}

impl Debug for AnyReport {
    fn fmt(&self, formatter: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(formatter, "{:?}", self.0)
    }
}

impl IntoReport for AnyReport {
    type Context = dyn Context + Send + Sync + 'static;

    #[track_caller]
    fn into_report(self) -> Report<Self::Context> {
        self.0
    }
}

impl<E: Into<Report<E>>> From<E> for AnyReport {
    #[track_caller]
    fn from(value: E) -> Self {
        Self(
            value
                .into()
                .into_dyn()
                .attach_printable(format!("into AnyReport at {}", Location::caller())),
        )
    }
}

impl<C> From<Report<C>> for AnyReport {
    #[track_caller]
    fn from(value: Report<C>) -> Self {
        Self(
            value
                .into_dyn()
                .attach_printable(format!("into AnyReport at {}", Location::caller())),
        )
    }
}

impl AnyReport {
    /// Adds additional information to the [`Frame`] stack.
    ///
    /// This behaves like [`attach_printable()`] but will not be shown when printing the
    /// [`AnyReport`]. To benefit from seeing attachments in normal error outputs, use
    /// [`attach_printable()`]
    ///
    /// **Note:** [`attach_printable()`] will be deprecated when specialization is stabilized and
    /// it becomes possible to merge these two methods.
    ///
    /// [`Display`]: core::fmt::Display
    /// [`Debug`]: core::fmt::Debug
    /// [`attach_printable()`]: Self::attach_printable
    #[track_caller]
    pub fn attach<A>(self, attachment: A) -> Self
    where
        A: Send + Sync + 'static,
    {
        Self(self.0.attach(attachment))
    }

    /// Adds additional (printable) information to the [`Frame`] stack.
    ///
    /// This behaves like [`attach()`] but the display implementation will be called when
    /// printing the [`AnyReport`].
    ///
    /// **Note:** This will be deprecated in favor of [`attach()`] when specialization is
    /// stabilized it becomes possible to merge these two methods.
    ///
    /// [`attach()`]: Self::attach
    ///
    /// ## Example
    ///
    /// ```rust
    /// use core::fmt;
    /// use std::fs;
    ///
    /// use error_stack::ResultExt;
    ///
    /// #[derive(Debug)]
    /// pub struct Suggestion(&'static str);
    ///
    /// impl fmt::Display for Suggestion {
    ///     fn fmt(&self, fmt: &mut fmt::Formatter<'_>) -> fmt::Result {
    ///         fmt.write_str(self.0)
    ///     }
    /// }
    ///
    /// fn read_file() -> Result<String, AnyReport> {
    ///     Ok(fs::read_to_string("config.txt")?)
    /// }
    ///
    /// # #[cfg_attr(not(nightly), allow(unused_variables))]
    /// let report = read_file()
    ///     .unwrap_err()
    ///     .attach(Suggestion("better use a file which exists next time!"));
    ///
    /// # #[cfg(nightly)]
    /// let suggestion = report.request_ref::<Suggestion>().next().unwrap();
    ///
    /// # #[cfg(nightly)]
    /// assert_eq!(suggestion.0, "better use a file which exists next time!");
    /// ```
    #[track_caller]
    pub fn attach_printable<A>(self, attachment: A) -> Self
    where
        A: fmt::Display + fmt::Debug + Send + Sync + 'static,
    {
        Self(self.0.attach_printable(attachment))
    }

    /// Add a new [`Context`] object to the top of the [`Frame`] stack, changing the type of the
    /// `AnyReport` to a specific `Report`.
    ///
    /// Please see the [`Context`] documentation for more information.
    #[track_caller]
    pub fn change_context<T>(self, context: T) -> Report<T>
    where
        T: crate::Context,
    {
        self.0.change_context(context)
    }
}

impl Deref for AnyReport {
    type Target = Report<dyn Context + Send + Sync + 'static>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl DerefMut for AnyReport {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

#[cfg(test)]
mod test {
    use core::error::Error;

    use super::*;

    #[derive(Debug)]
    struct OtherErr;

    impl Display for OtherErr {
        fn fmt(&self, formatter: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
            write!(formatter, "OtherErr")
        }
    }

    impl Error for OtherErr {}

    #[test]
    fn any_err_from_err() {
        let err = std::io::Error::from(std::io::ErrorKind::NotFound);
        let _anyerr: AnyReport = err.into();
    }

    #[test]
    fn any_err_from_into_report() {
        let report = Report::new(OtherErr);
        let anyerr: AnyReport = report.into();
        let _out = anyerr.change_context(OtherErr);
    }

    #[test]
    fn any_err_report_auto_propagation() {
        fn foo() -> Result<(), AnyReport> {
            let result = Err(Report::new(OtherErr));
            result?;
            Ok(())
        }
        assert!(foo().is_err());
    }

    #[test]
    fn any_err_err_auto_propagation() {
        fn foo() -> Result<(), AnyReport> {
            let result = Err(std::io::Error::from(std::io::ErrorKind::NotFound));
            result?;
            Ok(())
        }
        assert!(foo().is_err());
    }
}
