# Ship one plugin of this marketplace to every Claude Code that installs it from GitHub.
#
# Installed plugins run from ~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/
# and refresh only when the version string rises. A pushed commit without a bump
# changes nothing and warns nobody. This target does the whole chain for one plugin:
# bump plugin.json and the marketplace entry, commit, push, refresh the marketplace
# clone, update the installed copy.
#
#   make release PLUGIN=csharp-lsp                   patch bump of the current version
#   make release PLUGIN=csharp-lsp VERSION=1.2.0     explicit version
#   make release PLUGIN=csharp-lsp MSG="..."         also drops the line under [Unreleased] / ### Changed

MARKETPLACE := ancplua-claude-plugins
CATALOG     := .claude-plugin/marketplace.json
INSTALLED   := $(HOME)/.claude/plugins/installed_plugins.json
MANIFEST     = plugins/$(PLUGIN)/.claude-plugin/plugin.json
CURRENT      = $(shell jq -r .version $(MANIFEST))
VERSION     ?= $(shell echo $(CURRENT) | awk -F. '{printf "%d.%d.%d", $$1, $$2, $$3 + 1}')

.PHONY: release
release: export RELEASE_MSG := $(MSG)
release:
	@test -n "$(PLUGIN)" || { echo "release: PLUGIN=<name> is required"; exit 1; }
	@test -f $(MANIFEST) || { echo "release: no $(MANIFEST)"; exit 1; }
	@jq -e --arg p "$(PLUGIN)" '.plugins[] | select(.name == $$p and .source == "./plugins/" + $$p)' $(CATALOG) >/dev/null \
		|| { echo "release: $(PLUGIN) is not a ./plugins entry of $(CATALOG)"; exit 1; }
	@if [ -z "$$(git status --porcelain)" ] && [ "$$(git rev-list --count @{u}..HEAD)" = 0 ] && [ -z "$$RELEASE_MSG" ]; then \
		echo "release: nothing changed since $(PLUGIN) $(CURRENT)"; exit 1; fi
	@if [ -n "$$RELEASE_MSG" ]; then \
		awk -v p="$(PLUGIN)" -v v="$(VERSION)" \
			'{ print } /^### Changed/ && !done { print "- **`" p "` plugin (→ " v ")**: " ENVIRON["RELEASE_MSG"]; done = 1 }' \
			CHANGELOG.md > CHANGELOG.md.tmp && mv CHANGELOG.md.tmp CHANGELOG.md; fi
	@jq --arg v "$(VERSION)" '.version = $$v' $(MANIFEST) > $(MANIFEST).tmp && mv $(MANIFEST).tmp $(MANIFEST)
	@jq --arg p "$(PLUGIN)" --arg v "$(VERSION)" '(.plugins[] | select(.name == $$p) | .version) = $$v' $(CATALOG) \
		> $(CATALOG).tmp && mv $(CATALOG).tmp $(CATALOG)
	@git add -A
	@git commit -q -m "$(PLUGIN) $(VERSION)$${RELEASE_MSG:+: $$RELEASE_MSG}"
	@git push -q origin HEAD
	@claude plugin marketplace update $(MARKETPLACE)
	@if jq -e --arg k "$(PLUGIN)@$(MARKETPLACE)" '.plugins[$$k]' $(INSTALLED) >/dev/null 2>&1; then \
		claude plugin update $(PLUGIN)@$(MARKETPLACE); \
	else echo "$(PLUGIN) is not installed here; nothing to update"; fi
	@echo "released $(PLUGIN) $(VERSION); restart Claude Code to load it"
