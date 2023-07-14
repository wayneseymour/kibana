Document es archiver load speed.

Metrics are needed for local, ess and serverless.

| Doc | Local | ESS | Serverless | Docs Count | Fields Count |
|--------|--------|--------|--------|--------|--------|
| x-pack/test/functional/es_archives/logstash_functional | "avg": 5565, "min": 5114,  "max": 6579  | "avg": 52402, "min": 19533, "max": 543249 | Cell | 4634 + 4757 + 4614 (3 indices) = 14005 | Cell |
| test/functional/fixtures/es_archiver/many_fields | "avg": 933, "min": 861, "max": 1436 | "avg": 3509, "min": 2526, "max": 5350 | Cell | 50 | Cell |
| x-pack/test/functional/es_archives/ml/farequote | "avg": 36275, "min": 8432, "max": 517495 | "avg": 46161, "min": 42851, "max": 59567 | Cell | 86274 | Cell |


<details><summary>Local Run Details</summary>
<p>

```
### r:
{
  "name": "x-pack/test/functional/es_archives/logstash_functional",
  "avg": 5565,
  "min": 5114,
  "max": 6579
}

### r:
{
  "name": "test/functional/fixtures/es_archiver/many_fields",
  "avg": 933,
  "min": 861,
  "max": 1436
}

### r:
{
  "name": "x-pack/test/functional/es_archives/ml/farequote",
  "avg": 36275,
  "min": 8432,
  "max": 517495
}
```

</p>
</details> 

<details><summary>ESS Run Details</summary>
<p>

```
### r:
{
  "name": "x-pack/test/functional/es_archives/logstash_functional",
  "avg": 52402,
  "min": 19533,
  "max": 543249
}

### r:
{
  "name": "test/functional/fixtures/es_archiver/many_fields",
  "avg": 3509,
  "min": 2526,
  "max": 5350
}

### r:
{
  "name": "x-pack/test/functional/es_archives/ml/farequote",
  "avg": 46161,
  "min": 42851,
  "max": 59567
}
```

</p>
</details> 