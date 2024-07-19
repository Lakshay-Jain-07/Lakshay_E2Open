This extension provides an integration of PyDev (http://www.pydev.org) in VSCode,
enabling users to leverage the features of one of the leading Python IDEs inside VSCode.

Note: this extension provides a **30-day trial** after installation and **must** be **purchased** for continued use.

Check http://www.pydev.org/vscode for more details!

## Features currently available

-   Code-completion

    -   Fast
    -   Context sensitive
    -   Common tokens
    -   Context insensitive with auto import
    -   Templates (since `0.5.0`)

-   Code formatter

    -   Fast
    -   Format ranges
    -   Format on type
    -   Since `0.5.0` supports using `Black`, `Ruff` and `autopep8` as the
        formatter (see related `python.pydev.formatter` setting -- for example,
        after installing `Ruff` in the python environment enable `Ruff` to be
        the formatter used by setting `python.pydev.formatter` to `ruff`).
    -   Since `0.6.0`, supports import sorting as a part of the code formatting
        (using isort or one of the internal formatters).

-   Code analysis

    -   Real time using `PyDev` semantic analyzer.

    -   Since `0.5.0` also supports using `MyPy`, `Ruff`, `PyLint` and `Flake8` for linting
        when a file is saved (see related `python.pydev.lint.*` settings -- for example,
        after installing `MyPy` in the python environment, enable `MyPy`
        code analysis through the `python.pydev.lint.mypy.use` setting)

-   Go to definition

-   Symbols for Workspace

-   Symbols for open editor

-   Find references

-   Quick fix for undefined variables (adds missing import)

-   Navigate to previous or next class or method (`Ctrl+Shift+Up`, `Ctrl+Shift+Down`)

-   Debugging (with the required `Python Debugger (PyDev)` extension (since `0.5.0`)

-   Initial integration with the `Testing view` (since `0.7.0`)
    -   Note: currently just updates tests for the currently opened file and doesn't load all workspace tests.

Note: the version of PyDev currently bundled is `12.1.0`.

## Requirements

Java 17 must be installed -- `python.pydev.java.home` may be used to specify its location if it's not found.
See http://www.pydev.org/vscode for instructions and other settings.

## Changelog

See: http://www.pydev.org/vscode/history.html

## License

-   PyDev for VSCode extension: Commercial (http://www.pydev.org/vscode/license.html)

Other bundled components:

-   PyDev: EPL (https://www.eclipse.org/org/documents/epl-v10.php)
-   LSP4J: EPL (https://www.eclipse.org/org/documents/epl-v10.php)
-   Eclipse core libraries: EPL (https://www.eclipse.org/org/documents/epl-v10.php)
