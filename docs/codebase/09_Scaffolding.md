# Scaffolding

Scaffolding is a way to keep the template codebase clean and organized. It allows for the generation of boilerplate
code, configuration files, and other artifacts that are needed to run the application.

To get started, edit the configuration file located at `.scaffold/scaffold.config.yaml` and run the command:

```bash
yarn scaffold apply
```

While required for the initial setup, the scaffold it can also be used to add new features, refactor existing code, or
update dependencies when the upstream template is updated.

Scaffolding is implemented using https://github.com/povio/scaffold and follows these principles:

- **Bound to the code** - Scaffolds should live next to the code they change and be changed with the code.

- **Declarative requests** - Request should describe the desired state and allow for executors to evolve with the code.

- **Idempotent** - Running the same command multiple times should not change the code.

- **Composable** - Scaffolds should build on top of each other.

- **Clean merges and deletes** - Scaffolds, when not activated, should live in a single folder and be easy to delete.
    Also, merging in changes should not conflict with any existing code.

- **No dependencies** - Removing or disabling a single scaffold should not break other scaffolds.

- **No required** - Scaffolds should not be required to run the code. They can be removed completely at any time, but
    this is _very discouraged_.
