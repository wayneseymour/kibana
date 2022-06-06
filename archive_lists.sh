
collect() {
  xpack=$(fgrep -ri '"index": ".kibana' x-pack/test --include=mappings.json | awk '{print $1}' | sed -e 's|:||')
  oss=$(fgrep -ri '"index": ".kibana' test --include=mappings.json | awk '{print $1}' | sed -e 's|:||')
}

standardList=("url" "index-pattern" "action" "query" "alert" "graph-workspace" "tag" "visualization" "canvas-element" "canvas-workpad" "dashboard" "search" "lens" "map" "cases" "uptime-dynamic-settings" "osquery-saved-query" "osquery-pack" "infrastructure-ui-source" "metrics-explorer-view" "inventory-view" "infrastructure-monitoring-log-view" "apm-indices")

for x in ${standardList[@]}; do
  echo $x
done


#for xpackArchive in $(fgrep -ri '"index": ".kibana' x-pack/test --include=mappings.json | awk '{print $1}' | sed -e 's|:||'); do
#  echo "### xpackArchive: ${xpackArchive}"
#done
