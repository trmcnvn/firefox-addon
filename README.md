# Firefox Addon Action

This action will publish your addon to the Firefox Addon store.

## Usage

See [action.yml](action.yml)

```yaml
steps:
  - uses: trmcnvn/firefox-addon@v1
    with:
      # uuid is only necessary when updating an existing addon,
      # omitting it will create a new addon
      uuid: '{7b312f5e-9680-436b-acc1-9b09f60e8aaa}'
      xpi: build/my-addon.xpi
      manifest: manifest.json
      api-key: ${{ secrets.FIREFOX_API_KEY }}
      api-secret: ${{ secrets.FIREFOX_API_SECRET }}
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
